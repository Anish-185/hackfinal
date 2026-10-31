# Judge0 setup

The coding engine never runs candidate code itself. It sends code to Judge0 CE,
which compiles and runs it inside the `isolate` sandbox. Pick one option.

## Option A: hosted Judge0 (fastest for a prototype)

1. Subscribe to **Judge0 CE** on RapidAPI and copy your key.
2. In `backend/.env`:
   ```
   JUDGE0_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_RAPIDAPI_KEY=<your key>
   JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
   ```
3. Check the plan's request limits, pricing and data-retention terms before you send candidate code to it.
   Each **Submit** uses one batch request plus polling, and each test case counts as one submission.

## Option B: self-host (recommended for anything beyond a demo)

Follow the official deployment guide: <https://github.com/judge0/judge0/blob/master/CHANGELOG.md#deployment-procedure>.
Short version, on a **dedicated Linux VM** (Ubuntu 22.04 is the tested target):

```bash
# Judge0 1.13.x needs cgroup v1. On Ubuntu 22.04+ add this to GRUB_CMDLINE_LINUX in /etc/default/grub:
#   systemd.unified_cgroup_hierarchy=0
sudo update-grub && sudo reboot

wget https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip
unzip judge0-v1.13.1.zip && cd judge0-v1.13.1
# Set REDIS_PASSWORD and POSTGRES_PASSWORD in judge0.conf, plus the hardening settings below.
docker compose up -d db redis
sleep 10
docker compose up -d
curl http://localhost:2358/about
```

Then set `JUDGE0_URL=http://<vm-address>:2358` and `JUDGE0_AUTH_TOKEN=<AUTHN_TOKEN>` in `backend/.env`.
Run `npm run validate` in `backend/` to check every seeded reference solution against your instance.

> Docker Desktop on Windows/macOS uses cgroup v2 and generally **cannot** run Judge0 1.13.x workers.
> Use a Linux VM (cloud VM, or WSL2 with a dedicated distro configured for cgroup v1) or the hosted option.

### Hardening settings for `judge0.conf`

| Setting | Value | Why |
|---|---|---|
| `AUTHN_HEADER` / `AUTHN_TOKEN` | `X-Auth-Token` / long random string | Only your backend can submit code |
| `ALLOW_ENABLE_NETWORK` | `false` | Candidate code can never open network connections |
| `ENABLE_NETWORK` | `false` | Default for every submission |
| `MAX_CPU_TIME_LIMIT` | `10` | Upper bound for infinite loops |
| `MAX_WALL_TIME_LIMIT` | `20` | Stops programs blocked on sleep or I/O |
| `MAX_MEMORY_LIMIT` | `524288` (KB) | Prevents memory exhaustion |
| `MAX_MAX_FILE_SIZE` | `4096` (KB) | Limits disk writes |
| `MAX_PROCESSES_AND_OR_THREADS` | `64` | Stops fork bombs (the JVM needs ~30) |
| `ENABLE_WAIT_RESULT` | `false` | Forces async submit + poll, as the backend does |
| `ENABLE_BATCHED_SUBMISSIONS` | `true` | The backend sends one batch per test run |
| `MAX_SUBMISSION_BATCH_SIZE` | `20` | Must be ≥ `JUDGE0_BATCH_SIZE` in the backend |
| `MAX_QUEUE_SIZE` | e.g. `500` | Back-pressure under load |

The backend also sets per-submission limits (CPU and wall time, memory, file size, process count,
`enable_network: false`) from each challenge's `timeLimit` and `memoryLimit`.

### Deployment rules

- Run Judge0 on its **own host or VM**. Its workers need `privileged: true` for `isolate`, so
  treat that machine as untrusted: no database credentials, no app secrets, no shared volumes.
- Expose port 2358 **only** to your backend (security group / firewall), never to the internet.
- Never mount application directories into the Judge0 containers.
- Keep Judge0 and the host kernel patched.
- For stronger isolation in production, run the Judge0 VM under gVisor or Firecracker microVMs.
