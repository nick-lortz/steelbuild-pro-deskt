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

  file: {
    uploadDrawing: (fileData) => ipcRenderer.invoke("file:uploadDrawing", fileData),
    downloadDrawing: (fileKey) => ipcRenderer.invoke("file:downloadDrawing", fileKey),
    deleteDrawing: (fileKey) => ipcRenderer.invoke("file:deleteDrawing", fileKey),
    openDrawing: (fileKey) => ipcRenderer.invoke("file:openDrawing", fileKey),
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
    createTask: (data) => ipcRenderer.invoke("db:createTask", data),
    listTasks: (projectId, options) => ipcRenderer.invoke("db:listTasks", projectId, options),
    updateTask: (id, data) => ipcRenderer.invoke("db:updateTask", id, data),
    deleteTask: (id, userId) => ipcRenderer.invoke("db:deleteTask", id, userId),
    createPMAInsight: (data) => ipcRenderer.invoke("db:createPMAInsight", data),
    listPMAInsights: (projectId, options) => ipcRenderer.invoke("db:listPMAInsights", projectId, options),
    updatePMAInsight: (id, data) => ipcRenderer.invoke("db:updatePMAInsight", id, data),
    resolvePMAInsight: (id, userId) => ipcRenderer.invoke("db:resolvePMAInsight", id, userId),
    dismissPMAInsight: (id, userId, reason) => ipcRenderer.invoke("db:dismissPMAInsight", id, userId, reason),
    generatePMAInsights: (projectId) => ipcRenderer.invoke("db:generatePMAInsights", projectId),
    createNotification: (data) => ipcRenderer.invoke("db:createNotification", data),
    listNotifications: (projectId, options) => ipcRenderer.invoke("db:listNotifications", projectId, options),
    markNotificationRead: (id) => ipcRenderer.invoke("db:markNotificationRead", id),
    createDrawingSet: (data) => ipcRenderer.invoke("db:createDrawingSet", data),
    listDrawingSets: (projectId, options) => ipcRenderer.invoke("db:listDrawingSets", projectId, options),
    updateDrawingSetStatus: (id, newStatus, userId, userRole) => ipcRenderer.invoke("db:updateDrawingSetStatus", id, newStatus, userId, userRole),
    deleteDrawingSet: (id, userId, userRole) => ipcRenderer.invoke("db:deleteDrawingSet", id, userId, userRole),
    createDrawingSheet: (data) => ipcRenderer.invoke("db:createDrawingSheet", data),
    listDrawingSheets: (setId, options) => ipcRenderer.invoke("db:listDrawingSheets", setId, options),
    updateDrawingSheetStatus: (id, newStatus, userId, userRole) => ipcRenderer.invoke("db:updateDrawingSheetStatus", id, newStatus, userId, userRole),
    deleteDrawingSheet: (id, userId, userRole) => ipcRenderer.invoke("db:deleteDrawingSheet", id, userId, userRole),
    createChangeOrder: (data) => ipcRenderer.invoke("db:createChangeOrder", data),
    listChangeOrders: (projectId, options) => ipcRenderer.invoke("db:listChangeOrders", projectId, options),
    updateChangeOrder: (id, data) => ipcRenderer.invoke("db:updateChangeOrder", id, data),
    deleteChangeOrder: (id, userId) => ipcRenderer.invoke("db:deleteChangeOrder", id, userId),
    createContract: (data) => ipcRenderer.invoke("db:createContract", data),
    listContracts: (projectId, options) => ipcRenderer.invoke("db:listContracts", projectId, options),
    updateContract: (id, data) => ipcRenderer.invoke("db:updateContract", id, data),
    deleteContract: (id, userId) => ipcRenderer.invoke("db:deleteContract", id, userId),
    calculateAutomatedSOV: (projectId) => ipcRenderer.invoke("db:calculateAutomatedSOV", projectId),
    recalculateProjectBudget: (projectId) => ipcRenderer.invoke("db:recalculateProjectBudget", projectId),
    recalculateProjectTotals: (projectId) => ipcRenderer.invoke("db:recalculateProjectTotals", projectId),
    getProjectFinancialSummary: (projectId) => ipcRenderer.invoke("db:getProjectFinancialSummary", projectId),
    updateProjectContractValue: (projectId, originalValue) => ipcRenderer.invoke("db:updateProjectContractValue", projectId, originalValue),
    getPMADailyBrief: (projectId) => ipcRenderer.invoke("db:getPMADailyBrief", projectId),
    setUserPreference: (userId, key, value) => ipcRenderer.invoke("db:setUserPreference", userId, key, value),
    getUserPreference: (userId, key) => ipcRenderer.invoke("db:getUserPreference", userId, key),
    getAllUserPreferences: (userId) => ipcRenderer.invoke("db:getAllUserPreferences", userId),
    deleteUserPreference: (userId, key) => ipcRenderer.invoke("db:deleteUserPreference", userId, key),
    computePortfolioMarginAtRisk: (projectIds) => ipcRenderer.invoke("db:computePortfolioMarginAtRisk", projectIds),
    updateProject: (id, data) => ipcRenderer.invoke("db:updateProject", id, data),
    listProjects: (options) => ipcRenderer.invoke("db:listProjects", options),
    createProductionNote: (data) => ipcRenderer.invoke("db:createProductionNote", data),
    listProductionNotes: (projectId, options) => ipcRenderer.invoke("db:listProductionNotes", projectId, options),
    updateProductionNote: (id, data) => ipcRenderer.invoke("db:updateProductionNote", id, data),
    deleteProductionNote: (id, userId) => ipcRenderer.invoke("db:deleteProductionNote", id, userId),
    restoreProductionNote: (id, userId) => ipcRenderer.invoke("db:restoreProductionNote", id, userId),
    addProductionNoteComment: (noteId, body, userId, mentions) => ipcRenderer.invoke("db:addProductionNoteComment", noteId, body, userId, mentions),
    listProductionNoteComments: (noteId) => ipcRenderer.invoke("db:listProductionNoteComments", noteId),
    getProductionNoteKPIs: (projectId) => ipcRenderer.invoke("db:getProductionNoteKPIs", projectId),
    convertProductionNoteToRFI: (noteId, userId) => ipcRenderer.invoke("db:convertProductionNoteToRFI", noteId, userId),
  },
  file: {
    uploadDrawing: (fileData) => ipcRenderer.invoke("file:uploadDrawing", fileData),
    downloadDrawing: (fileKey) => ipcRenderer.invoke("file:downloadDrawing", fileKey),
    deleteDrawing: (fileKey) => ipcRenderer.invoke("file:deleteDrawing", fileKey),
    openDrawing: (fileKey) => ipcRenderer.invoke("file:openDrawing", fileKey),
  },
});
