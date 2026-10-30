"""Run tests on candidate code in a fresh, locked-down container (CLAUDE.md rule 3).

Lifecycle of one run:
1. Create a tmpfs-backed volume for /workspace (size-capped, in RAM). The root filesystem
   is read-only, and Docker can't copy files into a plain --tmpfs mount, so /workspace is
   a volume instead.
2. Start the container. Its launcher waits for /workspace/.runner/go.
3. Copy the files in, then create the go file. The launcher runs the test command and
   writes its exit code to /workspace/.runner/exit_code.
4. Poll for the exit code until the deadline. Read the report while the container is
   still running (a tmpfs volume is emptied once the container stops).
5. Always remove the container and the volume.
"""

import io
import json
import logging
import tarfile
import time
import uuid
from functools import lru_cache
from typing import Any

import docker
from docker.errors import APIError, DockerException, ImageNotFound, NotFound
from docker.models.containers import Container
from docker.types import LogConfig
from pydantic import ValidationError

from contracts_gen.run_result import RunResult, Summary, TestResult
from contracts_gen.task_spec import RelPath
from runner.runtimes import REPORT_PATH, RUNTIMES, WORKSPACE

logger = logging.getLogger("runner")

RUNNER_UID = 10001  # the `runner` user in every runtimes/* image
MEMORY_LIMIT = "512m"
NANO_CPUS = 1_000_000_000  # 1 CPU
PIDS_LIMIT = 128
WORKSPACE_SIZE = "64m"
LOG_MAX_SIZE = "1m"  # caps container log storage; we only keep the tail anyway
TAIL_BYTES = 4096
POLL_INTERVAL_S = 0.1

RESERVED_DIR = ".runner"
EXIT_CODE_PATH = f"{WORKSPACE}/{RESERVED_DIR}/exit_code"
LAUNCHER = (
    f"while [ ! -e {WORKSPACE}/{RESERVED_DIR}/go ]; do sleep 0.05; done; "
    f'"$@"; echo $? > {EXIT_CODE_PATH}; '
    # Stay alive so the report can be read before the tmpfs volume goes away.
    "exec sleep 3600"
)


class RunnerError(RuntimeError):
    """The sandbox itself failed (Docker unavailable, image missing). Not the candidate's fault."""


def run_tests(
    runtime: str,
    files: dict[str, str],
    test_paths: list[str],
    timeout_s: int = 30,
) -> RunResult:
    spec = RUNTIMES.get(runtime)
    if spec is None:
        raise ValueError(f"Unknown runtime {runtime!r}; expected one of {sorted(RUNTIMES)}")
    _validate_paths(files, test_paths)

    client = _docker_client()
    volume = client.volumes.create(
        name=f"assess-run-{uuid.uuid4().hex[:12]}",
        driver="local",
        driver_opts={
            "type": "tmpfs",
            "device": "tmpfs",
            "o": f"size={WORKSPACE_SIZE},uid={RUNNER_UID},gid={RUNNER_UID},mode=0700",
        },
        labels={"assess.runner": "workspace"},
    )
    test_command = spec.test_command(test_paths, set(files))
    container: Container | None = None
    try:
        try:
            container = client.containers.create(
                image=spec.image,
                command=["sh", "-c", LAUNCHER, "launcher", *test_command],
                user=f"{RUNNER_UID}:{RUNNER_UID}",
                working_dir=WORKSPACE,
                environment={
                    "HOME": f"{WORKSPACE}/{RESERVED_DIR}/home",
                    "TMPDIR": f"{WORKSPACE}/{RESERVED_DIR}/tmp",
                },
                network_mode="none",
                mem_limit=MEMORY_LIMIT,
                memswap_limit=MEMORY_LIMIT,  # no swap
                nano_cpus=NANO_CPUS,
                pids_limit=PIDS_LIMIT,
                read_only=True,
                cap_drop=["ALL"],
                security_opt=["no-new-privileges"],
                init=True,
                volumes={volume.name: {"bind": WORKSPACE, "mode": "rw"}},
                log_config=LogConfig(
                    type=LogConfig.types.JSON, config={"max-size": LOG_MAX_SIZE, "max-file": "1"}
                ),
                labels={"assess.runner": "sandbox", "assess.runtime": runtime},
            )
        except ImageNotFound as exc:
            raise RunnerError(f"Image {spec.image} not found; run `make runtimes`") from exc

        container.start()
        container.put_archive(WORKSPACE, _tar(files))
        container.put_archive(WORKSPACE, _tar({f"{RESERVED_DIR}/go": ""}))
        started = time.monotonic()

        exit_code, timed_out = _wait_for_exit_code(container, started + timeout_s)
        duration_ms = round((time.monotonic() - started) * 1000)
        report = None if timed_out else _read_json(container, REPORT_PATH)
        if timed_out:
            container.kill()
        container.reload()
        oom_killed = bool(container.attrs["State"].get("OOMKilled"))
        stdout = container.logs(stdout=True, stderr=False)
        stderr = container.logs(stdout=False, stderr=True)
    except DockerException as exc:
        raise RunnerError(f"Sandbox failure: {exc}") from exc
    finally:
        _cleanup(container, volume)

    tests = spec.parse_report(report) if report is not None else []
    if timed_out:
        status = "timeout"
    elif oom_killed:
        status = "oom"
    elif exit_code is None or report is None or not spec.ran_cleanly(exit_code, report):
        status = "error"
    else:
        status = "ok"

    result = RunResult(
        status=status,
        duration_ms=duration_ms,
        tests=tests,
        summary=_summarize(tests),
        stdout_tail=_tail(stdout),
        stderr_tail=_tail(stderr),
    )
    logger.info(
        json.dumps(
            {
                "event": "run",
                "runtime": runtime,
                "status": status,
                "exit_code": exit_code,
                "duration_ms": duration_ms,
                **result.summary.model_dump(),
            }
        )
    )
    return result


@lru_cache
def _docker_client() -> docker.DockerClient:
    try:
        return docker.from_env()
    except DockerException as exc:
        raise RunnerError(f"Docker is not reachable: {exc}") from exc


def _validate_paths(files: dict[str, str], test_paths: list[str]) -> None:
    if not test_paths:
        raise ValueError("test_paths must not be empty")
    for path in [*files, *test_paths]:
        try:
            RelPath.model_validate(path)
        except ValidationError as exc:
            raise ValueError(f"Invalid path {path!r}: must be a relative POSIX path") from exc
        if path.split("/")[0] == RESERVED_DIR:
            raise ValueError(f"Invalid path {path!r}: {RESERVED_DIR}/ is reserved for the runner")
    for path in test_paths:
        if path.startswith("-"):
            raise ValueError(f"Invalid test path {path!r}: would be read as a command-line option")


def _tar(files: dict[str, str]) -> bytes:
    """Tar owned by the sandbox user, with explicit parent directories and runner dirs."""
    dirs = {f"{RESERVED_DIR}", f"{RESERVED_DIR}/tmp", f"{RESERVED_DIR}/home"}
    for path in files:
        parts = path.split("/")[:-1]
        dirs.update("/".join(parts[: i + 1]) for i in range(len(parts)))

    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w") as tar:
        for directory in sorted(dirs):
            info = _tar_info(directory, tarfile.DIRTYPE, 0o755)
            tar.addfile(info)
        for path, content in files.items():
            data = content.encode()
            info = _tar_info(path, tarfile.REGTYPE, 0o644)
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))
    return buffer.getvalue()


def _tar_info(name: str, kind: bytes, mode: int) -> tarfile.TarInfo:
    info = tarfile.TarInfo(name)
    info.type = kind
    info.mode = mode
    info.uid = info.gid = RUNNER_UID
    info.mtime = int(time.time())
    return info


def _wait_for_exit_code(container: Container, deadline: float) -> tuple[int | None, bool]:
    """Returns (exit code, timed out). The exit code is None if the launcher died."""
    while True:
        raw = _read_file(container, EXIT_CODE_PATH)
        if raw and raw.strip():
            try:
                return int(raw.strip()), False
            except ValueError:
                return None, False
        container.reload()
        if container.status != "running":
            return None, False
        if time.monotonic() >= deadline:
            return None, True
        time.sleep(POLL_INTERVAL_S)


def _read_file(container: Container, path: str) -> bytes | None:
    try:
        stream, _ = container.get_archive(path)
    except NotFound:
        return None
    with tarfile.open(fileobj=io.BytesIO(b"".join(stream))) as tar:
        member = tar.next()
        extracted = tar.extractfile(member) if member else None
        return extracted.read() if extracted else None


def _read_json(container: Container, path: str) -> dict[str, Any] | None:
    raw = _read_file(container, path)
    if raw is None:
        return None
    try:
        report = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return report if isinstance(report, dict) else None


def _summarize(tests: list[TestResult]) -> Summary:
    passed = sum(test.outcome == "passed" for test in tests)
    failed = sum(test.outcome in ("failed", "error") for test in tests)
    return Summary(passed=passed, failed=failed, total=len(tests))


def _tail(output: bytes) -> str:
    return output[-TAIL_BYTES:].decode("utf-8", errors="replace")


def _cleanup(container: Container | None, volume: Any) -> None:
    if container is not None:
        try:
            container.remove(force=True)
        except APIError:
            logger.exception("Failed to remove sandbox container %s", container.id)
    try:
        volume.remove(force=True)
    except APIError:
        logger.exception("Failed to remove sandbox volume %s", volume.name)
