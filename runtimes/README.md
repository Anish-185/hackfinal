# runtimes

One Dockerfile per runtime. The Celery worker starts a fresh runner container from these for every run: network disabled, CPU/memory/PID/time limits, non-root user. Empty for now.
