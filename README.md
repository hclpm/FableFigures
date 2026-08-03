<div align="center">

# Fable Figures

**A BioRender‑style visual canvas editor for biology & biomedical figures — as a native desktop app.**

[![License: MIT](https://img.shields.io/badge/License-MIT-informational.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-30-47848F.svg?logo=electron&logoColor=white)](https://www.electronjs.org/)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)
![No build step](https://img.shields.io/badge/UI-vanilla%20JS%20%2B%20SVG-yellow.svg)

</div>

Fable Figures lets you compose publication‑ready scientific figures by dragging pre‑made
biology assets, shapes, arrows and text onto an SVG canvas — no design skills required.
The entire editor is **framework‑free JavaScript rendering an SVG document**, wrapped in a
small **Electron** shell for a native desktop experience (with native Save/PDF/folder
dialogs). It also runs straight from a browser for quick hacking.

> Replace `YOUR_USERNAME` in the clone URL and in `package.json` with your GitHub handle.

---

## ✨ Features

- **Rich asset library** — 30+ shapes, 8 arrow/connector styles, dozens of biology icons
  (cells, organelles, gut epithelium, immune cells, organoids, molecules), lab equipment,
  human/cohort figures, and organs. Full‑color, matte illustrations.
- **Smart connectors** — arrows snap to **ports** placed a uniform gap outside a shape's
  outline (circular for circles/ellipses, rectangular otherwise) and follow the shape as
  it moves, resizes, or rotates. Arrowheads render cleanly (the line stops at the head).
- **Multi‑object presets** — one‑click cells, plots (PCA / UMAP / line / bar), study
  cohorts, and neural‑network diagrams (MLP, CNN, autoencoder, transformer, GNN), plus
  your own saved layouts as reusable presets.
- **Full editing** — move / resize / rotate, marquee & Shift/⌘ multi‑select, group
  resize & rotate, align / distribute, z‑order, cascading copy/paste, duplicate, undo/redo.
- **Text** with fonts, size, bold/italic/underline, alignment and color; inline editing
  on the canvas.
- **AI images** — generate figure elements from a text prompt (via a free image service).
- **Export** to **PNG / SVG / PDF** at multiple resolutions.
- **Projects** — local autosave, thumbnails, duplicate, and portable **Templates
  export/import** (`.json`) to move your library between machines.
- **Polish** — light/dark mode, canvas themes, artboard sizes, and a bilingual UI
  (English default, Korean optional).

---

## 🚀 Quick start

Requires **[Node.js](https://nodejs.org) 18+**.

```bash
git clone https://github.com/YOUR_USERNAME/fable-figures.git
cd fable-figures
npm install       # downloads Electron (~one‑time)
npm start         # opens the desktop window
```

**No‑install preview:** just open `app/index.html` in any modern browser. Everything
except the Electron‑only bits (native Save dialog, PDF via `printToPDF`, folder picker,
file‑based storage) works, and edits show up on refresh — handy for fast UI iteration.

---

## 📦 Building installers

[electron‑builder](https://www.electron.build/) is preconfigured:

```bash
npm run dist:mac      # → release/  (.dmg + .zip)
npm run dist:win      # → release/  (NSIS installer + portable .exe)
npm run dist:linux    # → release/  (AppImage)
```

Builds are **unsigned** by default. On macOS, first launch shows a Gatekeeper warning —
right‑click → Open, or System Settings → Privacy & Security → Open Anyway. For
warning‑free distribution, sign & notarize with an Apple Developer ID.

---

## 🎛️ Using it

- **Drag** an asset from the left library onto the canvas (or double‑click it to drop at
  center). **Double‑click empty canvas** to add text.
- **Select** to edit in the right‑hand **Properties** panel; drag a marquee or Shift/⌘‑click
  for multi‑select.
- **Connect** two shapes: grab an arrow's endpoint and drop it on a shape's port.
- Common shortcuts: ⌘Z / ⇧⌘Z undo/redo, ⌘C/⌘V/⌘D copy/paste/duplicate, ⌘A select‑all,
  ⌘E export, ⌘S save, ⌘±/⌘0 zoom, arrow keys nudge.

---

## 🗂️ Project structure

```
fable-figures/
├── main.js            Electron main process (window, dock icon, IPC handlers)
├── preload.js         contextBridge → window.camrender (printPDF, saveFile, pickFolder, …)
├── package.json       app metadata + electron-builder config
├── build/             app icon(s)
└── app/
    ├── index.html     DOM shell (home screen, editor layout, modals)
    ├── styles.css     all styling (light/dark)
    ├── assets.js      asset catalog + i18n → window.CAM
    ├── app.js         engine: state, rendering, connectors, presets, interaction
    └── app2.js        UI: library, properties, export, projects, settings, templates
```

The three `app/*.js` files load as plain `<script>` tags sharing one global scope — **no
bundler, no transpile step**. Keep additions ES5‑friendly and global.

---

## 🏗️ Architecture (in one screen)

- **State** — `state = { objs, sel, view, bg, uploads, art }`; objects are
  `{id, type:'shape'|'icon'|'image'|'text'|'connector', x, y, w, h, rot, opacity, … }`
  (x/y = center). Undo/redo uses JSON snapshots.
- **Rendering** — `render()` serializes `state.objs` to SVG inside `#objlayer`;
  `renderOverlay()` draws selection handles / group box / connector ports.
- **Connectors** — `connEndpoints()` + `portWorld()`/`shapePortsLocal()` compute
  uniform‑gap ports; `connectorMarkup()` draws the line and arrowheads.
- **Presets** — `buildPreset()` / `buildNetwork()` return arrays of objects.
- **Persistence** — projects live in `localStorage` (key `camrender.projects`) or, when a
  project folder is set, in `<folder>/fable-figures-library.json` via Electron IPC.
- **Extending** — add a shape (`shapePath()` + `SHAPES`), an icon (`ICONS` + `ICON_SIZES`
  + a group), a preset (`buildPreset()` + a catalog entry), or a language string (`I18N`).

> Internal identifiers keep the project's original codename (`camrender`) for storage
> compatibility; the product name is **Fable Figures**.

---

## 🔒 Data & privacy

- All projects are stored **locally** — nothing is uploaded.
- The optional **AI image** feature sends your prompt text to a free third‑party image
  service ([Pollinations](https://pollinations.ai)); it needs internet and can be swapped
  out in `genAI()` (`app/app2.js`). Don't use it for confidential text.

---

## 🤝 Contributing

Issues and pull requests are welcome. Because there's no build step, the workflow is
simply: edit `app/*.js` / `app/*.css`, refresh the browser (or restart `npm start`), and
verify. Please keep the code framework‑free and run a quick `node --check app/*.js`.

## 📄 License

[MIT](LICENSE) © Lee
