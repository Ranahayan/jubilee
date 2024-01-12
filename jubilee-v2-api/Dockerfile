# Dockerfile
ARG ROLE=api
# ROLE = api | worker

FROM --platform=linux/amd64 python:3.11-buster AS base

RUN mkdir -p /opt/app
RUN mkdir -p /opt/app/pip_cache
RUN mkdir -p /opt/app/core
# install nginx and dependencies for pycurl
RUN echo "deb http://archive.debian.org/debian/ buster main" > /etc/apt/sources.list && \
    echo "deb http://archive.debian.org/debian-security/ buster/updates main" >> /etc/apt/sources.list && \
    echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99no-check-valid && \
    apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    python3-pip \
    python3-dev \
    nginx \
    libcurl4-openssl-dev \
    libssl-dev \
    wkhtmltopdf 

COPY nginx.default /etc/nginx/sites-available/default
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log
# configure permissions
RUN chown -R www-data:www-data /opt/app
RUN chown -R www-data:www-data /root
# copy source and install dependencies
COPY requirements.txt /opt/app/
WORKDIR /opt/app
RUN pip install -r requirements.txt --use-deprecated=legacy-resolver
COPY . /opt/app/core/

FROM base AS api
COPY start-server.sh /opt/app/
# start server
EXPOSE 8020
STOPSIGNAL SIGTERM
CMD ["/opt/app/start-server.sh"]

FROM base AS worker
# start worker
COPY start-worker.sh /opt/app/
CMD ["/opt/app/start-worker.sh"]

FROM base AS worker_images
# start worker images
COPY start-worker-images.sh /opt/app/
CMD ["/opt/app/start-worker-images.sh"]

FROM base AS beat
# start celery beat
COPY start-beat.sh /opt/app/
CMD ["/opt/app/start-beat.sh"]

FROM base AS dev
# start server in development mode
EXPOSE 8000
COPY start-dev.sh /opt/app/
CMD ["/opt/app/start-dev.sh"]

FROM ${ROLE} AS final
