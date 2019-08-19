#!/usr/bin/env bash
git pull
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
npm i
wait
kill -9 $PPID
