#!/usr/bin/env bash
# start-worker-images.sh

(cd core; python3 -m celery --app=core worker -Q jubilee-image_generation --concurrency=2 -l info --max-tasks-per-child=10 --max-memory-per-child=300000)