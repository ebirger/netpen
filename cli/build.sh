#!/bin/sh

BIN=netpen

pyinstaller -n "$BIN" --onefile cli/__main__.py

cp "dist/$BIN" /out
