#!/usr/bin/env bash
# run_sqs.sh

python -m celery --app=core worker --concurrency=1 -l info