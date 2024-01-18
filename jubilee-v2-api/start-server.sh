#!/usr/bin/env bash
# start-server.sh

(cd core; python3 manage.py collectstatic --noinput) &
(cd core; python3 manage.py migrate) &
(cd core; ddtrace-run daphne -p 8010 -b 0.0.0.0 core.asgi:application) &
nginx -g "daemon off;"
