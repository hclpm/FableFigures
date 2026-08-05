#!/bin/bash
# Double-click this file to build and install Fable Figures.
# First run downloads dependencies and builds the app (needs internet, a few minutes).
# After that, Fable Figures lives in your Applications folder like any other app.
cd "$(dirname "$0")" || exit 1
echo "======================================"
echo "  Fable Figures — build & install"
echo "======================================"

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "Node.js is not installed. Get the LTS installer from https://nodejs.org,"
  echo "install it, then double-click this file again."
  read -n 1 -s -r -p "Press any key to close."
  exit 1
fi

echo
echo "[1/3] Installing dependencies (first run only)…"
npm install || { echo; echo "npm install failed. Check your internet connection and try again."; read -n 1 -s -r -p "Press any key to close."; exit 1; }

echo
echo "[2/3] Building the desktop app… this can take a few minutes."
npm run dist:mac || { echo; echo "Build failed. See the messages above."; read -n 1 -s -r -p "Press any key to close."; exit 1; }

APP="$(find release -maxdepth 3 -name 'Fable Figures.app' -type d 2>/dev/null | head -1)"
if [ -z "$APP" ]; then
  echo
  echo "Build finished but the app bundle wasn't found. Opening the release folder…"
  open release 2>/dev/null || true
  read -n 1 -s -r -p "Press any key to close."
  exit 1
fi

echo
echo "[3/3] Installing to /Applications…"
rm -rf "/Applications/Fable Figures.app"
cp -R "$APP" "/Applications/" || { echo "Couldn't copy to /Applications. Try dragging it there from the release folder."; open release; read -n 1 -s -r -p "Press any key to close."; exit 1; }
# The build is unsigned; clear the quarantine flag so it opens without a Gatekeeper prompt.
xattr -dr com.apple.quarantine "/Applications/Fable Figures.app" 2>/dev/null || true

open -R "/Applications/Fable Figures.app"
echo
echo "Done. Fable Figures is now in your Applications folder — double-click to launch."
echo "(You can move this repo anywhere or delete the release/ folder now.)"
read -n 1 -s -r -p "Press any key to close."
