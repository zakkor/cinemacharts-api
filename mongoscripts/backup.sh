#!/bin/sh
id=${1:-"f87cc1c664ae"}
docker cp "$id":/data/db/. /home/ed/cinemacharts-mongo-data/
name="/home/ed/cinemacharts-mongo-data-$(echo `date '+%F-%T'` | sed s/:/_/g).tar.gz"
tar -cvf "$name" /home/ed/cinemacharts-mongo-data/
