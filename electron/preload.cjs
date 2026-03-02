const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),
  
  saveFileDialog: (options) => ipcRenderer.invoke("save-file-dialog", options),
  
  openFileDialog: (options) => ipcRenderer.invoke("open-file-dialog", options),
  
  writeFile: (filePath, data) => ipcRenderer.invoke("write-file", filePath, data),
  
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  
  onMenuNewProject: (callback) => {
    ipcRenderer.on("menu-new-project", callback);
    return () => ipcRenderer.removeListener("menu-new-project", callback);
  },
  
  onMenuExportDailyReport: (callback) => {
    ipcRenderer.on("menu-export-daily-report", (event, filePath) => callback(filePath));
    return () => ipcRenderer.removeListener("menu-export-daily-report", callback);
  },
  
  onMenuExportSOV: (callback) => {
    ipcRenderer.on("menu-export-sov", (event, filePath) => callback(filePath));
    return () => ipcRenderer.removeListener("menu-export-sov", callback);
  },
  
  onMenuNavigate: (callback) => {
    ipcRenderer.on("menu-navigate", (event, path) => callback(path));
    return () => ipcRenderer.removeListener("menu-navigate", callback);
  },
  
  isElectron: true,
});
