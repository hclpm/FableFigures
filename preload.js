// Bridges a tiny, safe API to the renderer.
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("camrender", {
  isElectron: true,
  printPDF: (args) => ipcRenderer.invoke("print-pdf", args),
  saveFile: (args) => ipcRenderer.invoke("save-file", args),
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  libRead: (file) => ipcRenderer.invoke("lib-read", file),
  libWrite: (args) => ipcRenderer.invoke("lib-write", args),
  onMenu: (cb) => {
    const chans = ["new","home","save","export","undo","redo","cut","copy","paste","duplicate","delete","selectall","zoomin","zoomout","fit"];
    chans.forEach(c => ipcRenderer.on("menu:" + c, () => cb(c)));
  }
});
