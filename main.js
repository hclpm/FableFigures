// Fable Figures — Electron main process. Crafted by Lee.
const { app, BrowserWindow, Menu, ipcMain, dialog, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");

const ICON_PATH = path.join(__dirname, "build", "icon.png");
// Show the real app name (not "Electron") in the menu bar and on dock hover, even in dev.
app.setName("Fable Figures");
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1080,
    minHeight: 680,
    backgroundColor: "#F3F5F6",
    icon: ICON_PATH,
    title: "Fable Figures",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });
  win.loadFile(path.join(__dirname, "app", "index.html"));
}

// Native menu so Cmd/Ctrl+C/V/X/Z and friends always work, plus app shortcuts.
function buildMenu() {
  const isMac = process.platform === "darwin";
  const send = (ch) => () => win && win.webContents.send(ch);
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [
        { label: "New Project", accelerator: "CmdOrCtrl+N", click: send("menu:new") },
        { label: "Open / Home", accelerator: "CmdOrCtrl+O", click: send("menu:home") },
        { type: "separator" },
        { label: "Save", accelerator: "CmdOrCtrl+S", click: send("menu:save") },
        { label: "Export…", accelerator: "CmdOrCtrl+E", click: send("menu:export") },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", click: send("menu:undo") },
        { label: "Redo", accelerator: "CmdOrCtrl+Shift+Z", click: send("menu:redo") },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", click: send("menu:cut") },
        { label: "Copy", accelerator: "CmdOrCtrl+C", click: send("menu:copy") },
        { label: "Paste", accelerator: "CmdOrCtrl+V", click: send("menu:paste") },
        { label: "Duplicate", accelerator: "CmdOrCtrl+D", click: send("menu:duplicate") },
        { label: "Delete", accelerator: "Delete", click: send("menu:delete") },
        { label: "Select All", accelerator: "CmdOrCtrl+A", click: send("menu:selectall") }
      ]
    },
    {
      label: "View",
      submenu: [
        { label: "Zoom In", accelerator: "CmdOrCtrl+=", click: send("menu:zoomin") },
        { label: "Zoom Out", accelerator: "CmdOrCtrl+-", click: send("menu:zoomout") },
        { label: "Fit", accelerator: "CmdOrCtrl+0", click: send("menu:fit") },
        { type: "separator" },
        { role: "togglefullscreen" },
        { role: "toggleDevTools" }
      ]
    },
    { role: "windowMenu" }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// High-quality PDF via Chromium print engine (used by the in-app PDF export when running in Electron).
ipcMain.handle("print-pdf", async (_e, { html, widthMicrons, heightMicrons }) => {
  const pdfWin = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  await pdfWin.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
  const data = await pdfWin.webContents.printToPDF({
    printBackground: true,
    pageSize: { width: widthMicrons, height: heightMicrons },
    margins: { marginType: "none" }
  });
  pdfWin.close();
  return data; // Buffer
});

ipcMain.handle("save-file", async (_e, { defaultName, data, filters }) => {
  const res = await dialog.showSaveDialog(win, { defaultPath: defaultName, filters });
  if (res.canceled || !res.filePath) return { ok: false };
  fs.writeFileSync(res.filePath, Buffer.from(data));
  return { ok: true, path: res.filePath };
});

// ---- project save-location support ----
ipcMain.handle("pick-folder", async () => {
  const r = await dialog.showOpenDialog(win, { properties: ["openDirectory", "createDirectory"] });
  return (r.canceled || !r.filePaths.length) ? null : r.filePaths[0];
});
ipcMain.handle("lib-read", (_e, file) => { try { return fs.readFileSync(file, "utf8"); } catch (e) { return null; } });
ipcMain.handle("lib-write", (_e, { file, data }) => {
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); return true; }
  catch (e) { return false; }
});

app.whenReady().then(() => {
  // Show the Fable Figures logo on the dock during development (npm start) on macOS.
  if (process.platform === "darwin" && app.dock) {
    try { app.dock.setIcon(nativeImage.createFromPath(ICON_PATH)); } catch (e) {}
  }
  buildMenu();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
