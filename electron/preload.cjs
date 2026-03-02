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
    init: () => ipcRenderer.invoke("db:init"),
    createRFI: (data) => ipcRenderer.invoke("db:createRFI", data),
    listRFIs: (projectId, options) => ipcRenderer.invoke("db:listRFIs", projectId, options),
    updateRFI: (id, data) => ipcRenderer.invoke("db:updateRFI", id, data),
    deleteRFI: (id, userId) => ipcRenderer.invoke("db:deleteRFI", id, userId),
    createEquipment: (data) => ipcRenderer.invoke("db:createEquipment", data),
    listEquipment: (projectId, options) => ipcRenderer.invoke("db:listEquipment", projectId, options),
    updateEquipment: (id, data) => ipcRenderer.invoke("db:updateEquipment", id, data),
    deleteEquipment: (id, userId) => ipcRenderer.invoke("db:deleteEquipment", id, userId),
    createCostCode: (data) => ipcRenderer.invoke("db:createCostCode", data),
    listCostCodes: (projectId, options) => ipcRenderer.invoke("db:listCostCodes", projectId, options),
    updateCostCode: (id, data) => ipcRenderer.invoke("db:updateCostCode", id, data),
    deleteCostCode: (id, userId) => ipcRenderer.invoke("db:deleteCostCode", id, userId),
    getDashboardCounts: (projectId) => ipcRenderer.invoke("db:getDashboardCounts", projectId),
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

contextBridge.exposeInMainWorld("SBP", {
  db: {
    init: () => ipcRenderer.invoke("db:init"),
    createRFI: (data) => ipcRenderer.invoke("db:createRFI", data),
    listRFIs: (projectId, options) => ipcRenderer.invoke("db:listRFIs", projectId, options),
    updateRFI: (id, data) => ipcRenderer.invoke("db:updateRFI", id, data),
    deleteRFI: (id, userId) => ipcRenderer.invoke("db:deleteRFI", id, userId),
    createEquipment: (data) => ipcRenderer.invoke("db:createEquipment", data),
    listEquipment: (projectId, options) => ipcRenderer.invoke("db:listEquipment", projectId, options),
    updateEquipment: (id, data) => ipcRenderer.invoke("db:updateEquipment", id, data),
    deleteEquipment: (id, userId) => ipcRenderer.invoke("db:deleteEquipment", id, userId),
    createCostCode: (data) => ipcRenderer.invoke("db:createCostCode", data),
    listCostCodes: (projectId, options) => ipcRenderer.invoke("db:listCostCodes", projectId, options),
    updateCostCode: (id, data) => ipcRenderer.invoke("db:updateCostCode", id, data),
    deleteCostCode: (id, userId) => ipcRenderer.invoke("db:deleteCostCode", id, userId),
    getDashboardCounts: (projectId) => ipcRenderer.invoke("db:getDashboardCounts", projectId),
  },
});
