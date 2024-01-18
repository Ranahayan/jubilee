#!/usr/bin/env bash
# start-server.sh

(cd core; python3 manage.py collectstatic --noinput)
(cd core; python3 manage.py migrate)
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ] ; then
    (cd core; python3 manage.py createsuperuser --no-input)
fi

(cd core; python3 manage.py runserver 0.0.0.0:8010)
