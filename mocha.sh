#!/bin/sh
rm -rf dist
gulp ts
./node_modules/.bin/mocha ./test/mocha/*-Test.js
