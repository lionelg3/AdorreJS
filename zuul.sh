#!/bin/sh
rm -rf dist
gulp ts
./node_modules/.bin/zuul --phantom -- ./test/zuul/*-Test.js
