#!/usr/bin/env bash
# start-beat.sh

(cd core; python3 -m celery --app=core beat -l info -S django)