"""Runs tests on candidate code in locked-down containers and returns a RunResult."""

from runner.runtimes import RUNTIMES
from runner.sandbox import RunnerError, run_tests

__all__ = ["RUNTIMES", "RunnerError", "run_tests"]
