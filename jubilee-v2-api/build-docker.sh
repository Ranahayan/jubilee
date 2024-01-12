#!/usr/bin/env bash

PROJECT_NAME="core"

API_NAME="$PROJECT_NAME-api"
WORKER_NAME="$PROJECT_NAME-worker"
BEAT_NAME="$PROJECT_NAME-beat"

EXISTING_API_ID=$(docker ps -a | grep $API_NAME | sed 's/ .*//')
EXISTING_WORKER_ID=$(docker ps -a | grep $WORKER_NAME | sed 's/ .*//')
EXISTING_BEAT_ID=$(docker ps -a | grep $BEAT_NAME | sed 's/ .*//')

function build {
  echo "Building images..."
  docker build --tag $API_NAME .
  docker build --build-arg ROLE=worker --tag $WORKER_NAME .
  docker build --build-arg ROLE=beat --tag $BEAT_NAME .
}

function run {
  echo "Running images..."
  docker run --name $API_NAME -d -p 8020:8020 $API_NAME
  docker run --name $WORKER_NAME -d $WORKER_NAME
  docker run --name $BEAT_NAME -d $BEAT_NAME
}

if [ $EXISTING_API_ID ]; then
    echo "Existing containers found..."
    read -p "Are you sure that you want to remove the containers and build new ones? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
      # Stop and remove container
      build
      docker stop $EXISTING_API_ID
      docker stop $EXISTING_WORKER_ID
      docker stop $EXISTING_BEAT_ID
      docker rm $EXISTING_API_ID
      docker rm $EXISTING_WORKER_ID
      docker rm $EXISTING_BEAT_ID
      run
    fi
else
  build
  run
fi
