#!/usr/bin/env bash
# start-worker.sh

(cd core; python3 -m celery --app=core worker -Q jubilee-default --concurrency=2 -l info --max-tasks-per-child=10 --max-memory-per-child=100000)