#!/bin/bash
# Double-click to remove the installed Fable Figures app from your Applications folder.
# Your saved projects and settings are NOT deleted (see the note at the end).
cd "$(dirname "$0")" || exit 1
echo "===================================="
echo "  Fable Figures — uninstall"
echo "===================================="

APP="/Applications/Fable Figures.app"
if [ -d "$APP" ]; then
  echo "Removing $APP …"
  if rm -rf "$APP"; then
    echo "Removed from Applications."
  else
    echo "Couldn't remove it automatically — drag Fable Figures to the Trash manually."
  fi
else
  echo "Fable Figures isn't in /Applications, so there's nothing to remove there."
fi

# Offer to clear the local build output in this repo (safe to delete; it's just build artifacts).
if [ -d release ]; then
  printf "Also delete the local build output (release/)? [y/N] "
  read ans
  case "$ans" in
    [Yy]*) rm -rf release && echo "Deleted release/." ;;
    *)     echo "Kept release/." ;;
  esac
fi

echo
echo "Your projects and settings are kept in:"
echo "  ~/Library/Application Support/Fable Figures"
echo "Delete that folder yourself only if you also want to erase your saved projects."
read -n 1 -s -r -p "Press any key to close."
