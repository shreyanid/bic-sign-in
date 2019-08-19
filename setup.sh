#!/usr/bin/env bash
git pull
npm i
wait
kill -9 $PPID
