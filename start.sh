#!/usr/bin/env bash
node app.js
wait
kill -9 $PPID
