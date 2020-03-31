#!/usr/bin/env nix-shell
#!nix-shell -i bash -p mongodb-tools

for f in "$@"
do
  mongoimport --db test --collection actormovies --file "$f"
done
