#!/bin/bash
# Double-click to run Fable Figures without installing it.
# Handy for a quick look; for a permanent app use "Install Fable Figures.command" instead.
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Get the LTS installer from https://nodejs.org, then try again."
  read -n 1 -s -r -p "Press any key to close."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run only)…"
  npm install || { echo "npm install failed."; read -n 1 -s -r -p "Press any key to close."; exit 1; }
fi

echo "Launching Fable Figures…"
npm start
