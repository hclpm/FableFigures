<div align="center">

<img src="build/icon.png" width="120" alt="Fable Figures">

# Fable Figures

A desktop editor for putting together biology and biomedical figures.

[![License: MIT](https://img.shields.io/badge/License-MIT-informational.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-30-47848F.svg?logo=electron&logoColor=white)](https://www.electronjs.org/)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)

</div>

Fable Figures is a small desktop app for building scientific figures — the kind that
usually take a general‑purpose graphics editor to assemble. You drag shapes, cell icons,
arrows and text onto a canvas, arrange them, and export to PNG, SVG or PDF.

It's deliberately simple under the hood: the whole editor is plain JavaScript drawing an
SVG document, with a thin Electron wrapper so it runs as a real desktop window (and can
use native save/PDF dialogs). There's no bundler and no build step for the UI — you can
open `app/index.html` in a browser and it just works.

## Why "Fable Figures"?

The name is a nod to how it was built: much of the app was written with Anthropic's Claude
**Fable** model.

## What's in it

- A library of ready-made assets: shapes, arrows/connectors, biology icons (cells,
  organelles, gut epithelium, immune cells, organoids, molecules), lab equipment, human
  and cohort figures, and organs.
- Connectors that attach to a shape's edge and stay attached when you move, resize or
  rotate it.
- Multi-object presets you can drop in with one click — cells, common plots (PCA, UMAP,
  line, bar), study cohorts, and neural-network diagrams — plus your own saved layouts.
- The usual editing: multi-select, group resize/rotate, align and distribute, z-order,
  copy/paste, duplicate, and undo/redo.
- Text with fonts, weight, style, alignment and color, edited inline on the canvas.
- Optional AI image generation from a text prompt.
- Local projects with autosave and thumbnails, plus a templates export/import so you can
  move your library between machines.
- Light/dark mode, a few canvas themes and artboard sizes, and an English/Korean UI.

## Getting started

Grab the code first:

```bash
git clone https://github.com/hclpm/fablefigures.git
cd fablefigures
```

Then pick whichever fits — no terminal needed for the first one:

**Install it as an app (recommended).** Double-click **`Install Fable Figures.command`**.
It installs dependencies, builds the app, and drops Fable Figures into your Applications
folder; from then on you launch it like any other app — no terminal, no npm. (To remove it
later, double-click **`Uninstall Fable Figures.command`**.) The first time you open a
`.command` file, macOS may need a right-click → Open to allow it. You'll need
[Node.js](https://nodejs.org) 18 or newer installed for the build step; the script tells you
if it's missing.

**Run it from the terminal.** With Node.js installed:

```bash
npm install    # one-time; pulls in Electron
npm start      # opens the app window
```

**Just peek at the UI.** Double-click **`Run Fable Figures (no install).command`**, or open
`app/index.html` in a browser. Everything works except the parts that need the desktop shell
(native save dialog, PDF export, the folder picker, and file-based storage).

## Building a distributable

`Install Fable Figures.command` already builds and installs on your own Mac. To produce
installers you can hand to other people, electron-builder is configured for every platform:

```bash
npm run dist:mac      # .dmg and .zip in release/
npm run dist:win      # NSIS installer and portable .exe
npm run dist:linux    # AppImage
```

The output in `release/` is a normal, double-clickable app — whoever installs it doesn't
need Node or this repo. Builds are unsigned, so on first launch macOS warns about an
unidentified developer (right-click → Open, or allow it under System Settings → Privacy &
Security). Signing and notarizing needs an Apple Developer account.

## A few things worth knowing

Shortcuts are the usual ones: Cmd+Z / Shift+Cmd+Z to undo/redo, Cmd+C/V/D, Cmd+A to select
all, Cmd+E to export, Cmd+S to save, Cmd+plus/minus/0 to zoom, arrow keys to nudge.
Double-click an empty spot on the canvas to add text; drag an arrow's endpoint onto a
shape to connect them.

## Project layout

```
Install Fable Figures.command           double-click: build + install to /Applications
Uninstall Fable Figures.command         double-click: remove the app from /Applications
Run Fable Figures (no install).command  double-click: run without installing
main.js        Electron main process (window, IPC handlers)
preload.js     bridge to the renderer (save, PDF, folder picker, storage)
package.json   metadata + electron-builder config
build/         app icons
app/
  index.html   layout: home screen, editor, dialogs
  styles.css   styling (light/dark)
  assets.js    asset catalog + translations (exposed as window.CAM)
  biology-assets.js  generated Biology icon overrides (from assets/biology/)
  human-assets.js    generated Human "people" icon overrides (from assets/human/people/)
  human-anatomy-assets.js  generated full-body anatomy icon overrides
  assets/biology/    standalone Biology SVG source files (cells, lab, research animals)
  assets/human/      standalone Human SVG source files (people, anatomy)
  app.js       the engine: state, rendering, connectors, presets, interaction
  app2.js      the UI: library, properties, export, projects, settings
```

The three files in `app/` load as ordinary script tags and share one global scope, so
there's nothing to compile. If you're extending it: shapes live in `shapePath()` +
`SHAPES`, icons in `ICONS`, presets in `buildPreset()`/`buildNetwork()`, and UI strings in
the `I18N` map. Projects are stored in `localStorage` (or a folder you pick in Settings).
Internal identifiers still use the project's old codename, `camrender`, for storage
compatibility; the app itself is Fable Figures.

The redesigned Biology and Human icons are kept as individual SVG files under `app/assets/`.
After editing a generator, run the matching rebuild script —
`node scripts/rebuild-biology-assets.js`, `rebuild-human-people-assets.js`, or
`rebuild-human-anatomy-assets.js` — to regenerate both the SVG files and the synchronous
`biology-assets.js` / `human-assets.js` / `human-anatomy-assets.js` registries the editor loads.

## Data and privacy

Everything is stored locally — nothing leaves your machine. The one exception is the
optional AI image feature, which sends the prompt text to a third-party service
([Pollinations](https://pollinations.ai)); it needs internet and can be swapped out in
`genAI()` if you'd rather use something else.

## Contributing

Issues and pull requests are welcome. Since there's no build step, the loop is just edit,
refresh (or restart `npm start`), and check. A quick `node --check app/*.js` before you
commit doesn't hurt.

## License

[MIT](LICENSE)
