const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  app: {
    getVersion: () => ipcRenderer.invoke("app:getVersion"),
    getPlatform: () => ipcRenderer.invoke("app:getPlatform"),
    getUserDataPath: () => ipcRenderer.invoke("app:getUserDataPath"),
  },

  shell: {
    openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url),
  },

  dialog: {
    saveFile: (options) => ipcRenderer.invoke("dialog:saveFile", options),
    openFile: (options) => ipcRenderer.invoke("dialog:openFile", options),
  },

  fs: {
    writeFile: (filePath, data) => ipcRenderer.invoke("fs:writeFile", filePath, data),
    readFile: (filePath) => ipcRenderer.invoke("fs:readFile", filePath),
  },

  db: {
    query: (query, params) => ipcRenderer.invoke("db:query", query, params),
    execute: (query, params) => ipcRenderer.invoke("db:execute", query, params),
  },

  menu: {
    onNewProject: (callback) => {
      const handler = () => callback();
      ipcRenderer.on("menu-new-project", handler);
      return () => ipcRenderer.removeListener("menu-new-project", handler);
    },
    onExportDailyReport: (callback) => {
      const handler = (event, filePath) => callback(filePath);
      ipcRenderer.on("menu-export-daily-report", handler);
      return () => ipcRenderer.removeListener("menu-export-daily-report", handler);
    },
    onExportSOV: (callback) => {
      const handler = (event, filePath) => callback(filePath);
      ipcRenderer.on("menu-export-sov", handler);
      return () => ipcRenderer.removeListener("menu-export-sov", handler);
    },
    onNavigate: (callback) => {
      const handler = (event, path) => callback(path);
      ipcRenderer.on("menu-navigate", handler);
      return () => ipcRenderer.removeListener("menu-navigate", handler);
    },
  },

  isElectron: true,
});
