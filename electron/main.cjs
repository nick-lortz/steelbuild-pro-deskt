const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { initDatabase, closeDatabase } = require("./db/init");
const {
  createRFI,
  listRFIs,
  updateRFI,
  deleteRFI,
  createEquipment,
  listEquipment,
  updateEquipment,
  deleteEquipment,
  createCostCode,
  listCostCodes,
  updateCostCode,
  deleteCostCode,
  createTask,
  listTasks,
  updateTask,
  deleteTask,
  createPMAInsight,
  listPMAInsights,
  updatePMAInsight,
  resolvePMAInsight,
  dismissPMAInsight,
  generatePMAInsights,
  getDashboardCounts,
  createNotification,
  listNotifications,
  markNotificationRead,
  createDrawingSet,
  listDrawingSets,
  updateDrawingSetStatus,
  deleteDrawingSet,
  createDrawingSheet,
  listDrawingSheets,
  updateDrawingSheetStatus,
  deleteDrawingSheet,
  createChangeOrder,
  listChangeOrders,
  updateChangeOrder,
  deleteChangeOrder,
  createContract,
  listContracts,
  updateContract,
  deleteContract,
  calculateAutomatedSOV,
  recalculateProjectBudget,
  recalculateProjectTotals,
  getProjectFinancialSummary,
  updateProjectContractValue,
  setUserPreference,
  getUserPreference,
  getAllUserPreferences,
  deleteUserPreference,
  computePortfolioMarginAtRisk,
  updateProject,
  listProjects,
} = require("./db/queries");

const isDev = !app.isPackaged;
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1024,
    minHeight: 768,
    title: "SteelBuild Pro",
    backgroundColor: "#fafafa",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      sandbox: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  createMenu();
}

function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Project",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow?.webContents.send("menu-new-project");
          },
        },
        { type: "separator" },
        {
          label: "Export Daily Report",
          accelerator: "CmdOrCtrl+E",
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              title: "Export Daily Report",
              defaultPath: `daily-report-${new Date().toISOString().split("T")[0]}.pdf`,
              filters: [
                { name: "PDF Files", extensions: ["pdf"] },
                { name: "All Files", extensions: ["*"] },
              ],
            });
            if (!result.canceled && result.filePath) {
              mainWindow?.webContents.send("menu-export-daily-report", result.filePath);
            }
          },
        },
        {
          label: "Export SOV",
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              title: "Export Schedule of Values",
              defaultPath: `sov-${new Date().toISOString().split("T")[0]}.xlsx`,
              filters: [
                { name: "Excel Files", extensions: ["xlsx"] },
                { name: "CSV Files", extensions: ["csv"] },
                { name: "All Files", extensions: ["*"] },
              ],
            });
            if (!result.canceled && result.filePath) {
              mainWindow?.webContents.send("menu-export-sov", result.filePath);
            }
          },
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Dashboard",
          accelerator: "CmdOrCtrl+D",
          click: () => {
            mainWindow?.webContents.send("menu-navigate", "/");
          },
        },
        {
          label: "Projects",
          accelerator: "CmdOrCtrl+P",
          click: () => {
            mainWindow?.webContents.send("menu-navigate", "/projects");
          },
        },
        {
          label: "Portfolio Pulse",
          accelerator: "CmdOrCtrl+Shift+P",
          click: () => {
            mainWindow?.webContents.send("menu-navigate", "/portfolio");
          },
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(process.platform === "darwin"
          ? [{ type: "separator" }, { role: "front" }, { type: "separator" }, { role: "window" }]
          : [{ role: "close" }]),
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Documentation",
          click: () => {
            require("electron").shell.openExternal("https://docs.steelbuildpro.com");
          },
        },
        {
          label: "Keyboard Shortcuts",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Keyboard Shortcuts",
              message: "SteelBuild Pro Shortcuts",
              detail: `
New Project: Ctrl/Cmd + N
Dashboard: Ctrl/Cmd + D
Projects: Ctrl/Cmd + P
Portfolio: Ctrl/Cmd + Shift + P
Export Daily Report: Ctrl/Cmd + E
              `.trim(),
            });
          },
        },
        { type: "separator" },
        {
          label: "About SteelBuild Pro",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About SteelBuild Pro",
              message: "SteelBuild Pro",
              detail: `Version: ${app.getVersion()}\n\nEnterprise Construction Management\nfor Steel Erection & Fabrication`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  const userDataPath = app.getPath("userData");
  initDatabase(userDataPath);
  
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  closeDatabase();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  closeDatabase();
});

ipcMain.handle("app:getVersion", () => {
  return app.getVersion();
});

ipcMain.handle("app:getPlatform", () => {
  return process.platform;
});

ipcMain.handle("shell:openExternal", async (event, url) => {
  if (typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    throw new Error('Invalid URL');
  }
  await shell.openExternal(url);
  return { success: true };
});

ipcMain.handle("app:getUserDataPath", () => {
  return app.getPath("userData");
});

ipcMain.handle("dialog:saveFile", async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle("dialog:openFile", async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle("fs:writeFile", async (event, filePath, data) => {
  try {
    const userDataPath = app.getPath("userData");
    if (!filePath.startsWith(userDataPath)) {
      throw new Error("File access denied: Path must be within user data directory");
    }
    fs.writeFileSync(filePath, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("fs:readFile", async (event, filePath) => {
  try {
    const userDataPath = app.getPath("userData");
    if (!filePath.startsWith(userDataPath)) {
      throw new Error("File access denied: Path must be within user data directory");
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("file:uploadDrawing", async (event, fileData) => {
  try {
    const userDataPath = app.getPath("userData");
    const drawingsDir = path.join(userDataPath, "drawings");
    
    if (!fs.existsSync(drawingsDir)) {
      fs.mkdirSync(drawingsDir, { recursive: true });
    }
    
    const { fileName, fileBuffer, projectId } = fileData;
    const projectDir = path.join(drawingsDir, projectId);
    
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${timestamp}_${safeFileName}`;
    const filePath = path.join(projectDir, uniqueFileName);
    
    const buffer = Buffer.from(fileBuffer);
    fs.writeFileSync(filePath, buffer);
    
    const fileKey = path.join(projectId, uniqueFileName);
    
    return {
      success: true,
      data: {
        fileKey,
        filePath,
        fileName: safeFileName,
        originalName: fileName,
        size: buffer.length,
      }
    };
  } catch (error) {
    console.error("File upload error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("file:downloadDrawing", async (event, fileKey) => {
  try {
    const userDataPath = app.getPath("userData");
    const drawingsDir = path.join(userDataPath, "drawings");
    const filePath = path.join(drawingsDir, fileKey);
    
    if (!filePath.startsWith(drawingsDir)) {
      throw new Error("File access denied: Invalid file path");
    }
    
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }
    
    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    return {
      success: true,
      data: {
        buffer: Array.from(buffer),
        fileName,
        mimeType: getMimeType(fileName),
      }
    };
  } catch (error) {
    console.error("File download error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("file:deleteDrawing", async (event, fileKey) => {
  try {
    const userDataPath = app.getPath("userData");
    const drawingsDir = path.join(userDataPath, "drawings");
    const filePath = path.join(drawingsDir, fileKey);
    
    if (!filePath.startsWith(drawingsDir)) {
      throw new Error("File access denied: Invalid file path");
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return { success: true };
  } catch (error) {
    console.error("File delete error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("file:openDrawing", async (event, fileKey) => {
  try {
    const userDataPath = app.getPath("userData");
    const drawingsDir = path.join(userDataPath, "drawings");
    const filePath = path.join(drawingsDir, fileKey);
    
    if (!filePath.startsWith(drawingsDir)) {
      throw new Error("File access denied: Invalid file path");
    }
    
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }
    
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error("File open error:", error);
    return { success: false, error: error.message };
  }
});

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.dwg': 'application/acad',
    '.dxf': 'application/dxf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

ipcMain.handle("db:init", async () => {
  try {
    const userDataPath = app.getPath("userData");
    return initDatabase(userDataPath);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:createRFI", async (event, data) => {
  try {
    return await createRFI(data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:listRFIs", async (event, projectId, options) => {
  try {
    return await listRFIs(projectId, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:updateRFI", async (event, id, data) => {
  try {
    return await updateRFI(id, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:deleteRFI", async (event, id, userId) => {
  try {
    return await deleteRFI(id, userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:createEquipment", async (event, data) => {
  try {
    return await createEquipment(data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:listEquipment", async (event, projectId, options) => {
  try {
    return await listEquipment(projectId, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:updateEquipment", async (event, id, data) => {
  try {
    return await updateEquipment(id, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:deleteEquipment", async (event, id, userId) => {
  try {
    return await deleteEquipment(id, userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:createCostCode", async (event, data) => {
  try {
    return await createCostCode(data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:listCostCodes", async (event, projectId, options) => {
  try {
    return await listCostCodes(projectId, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:updateCostCode", async (event, id, data) => {
  try {
    return await updateCostCode(id, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:deleteCostCode", async (event, id, userId) => {
  try {
    return await deleteCostCode(id, userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:getDashboardCounts", async (event, projectId) => {
  try {
    return await getDashboardCounts(projectId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:createTask", async (event, data) => {
  try {
    return await createTask(data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:listTasks", async (event, projectId, options) => {
  try {
    return await listTasks(projectId, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:updateTask", async (event, id, data) => {
  try {
    return await updateTask(id, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:deleteTask", async (event, id, userId) => {
  try {
    return await deleteTask(id, userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:createPMAInsight", async (event, data) => {
  try {
    return await createPMAInsight(data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:listPMAInsights", async (event, projectId, options) => {
  try {
    return await listPMAInsights(projectId, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:updatePMAInsight", async (event, id, data) => {
  try {
    return await updatePMAInsight(id, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:resolvePMAInsight", async (event, id, userId) => {
  try {
    return await resolvePMAInsight(id, userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:dismissPMAInsight", async (event, id, userId, reason) => {
  try {
    return await dismissPMAInsight(id, userId, reason);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:generatePMAInsights", async (event, projectId) => {
  try {
    return await generatePMAInsights(projectId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:createNotification", async (event, data) => {
  try {
    return await createNotification(data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:listNotifications", async (event, projectId, options) => {
  try {
    return await listNotifications(projectId, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:markNotificationRead", async (event, id) => {
  try {
    return await markNotificationRead(id);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:createDrawingSet", async (event, data) => {
  try {
    return await createDrawingSet(data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:listDrawingSets", async (event, projectId, options) => {
  try {
    return await listDrawingSets(projectId, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:updateDrawingSetStatus", async (event, id, newStatus, userId) => {
  try {
    return await updateDrawingSetStatus(id, newStatus, userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:deleteDrawingSet", async (event, id, userId) => {
  try {
    return await deleteDrawingSet(id, userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:createDrawingSheet", async (event, data) => {
  try {
    return await createDrawingSheet(data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:listDrawingSheets", async (event, setId, options) => {
  try {
    return await listDrawingSheets(setId, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:updateDrawingSheetStatus", async (event, id, newStatus, userId) => {
  try {
    return await updateDrawingSheetStatus(id, newStatus, userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:deleteDrawingSheet", async (event, id, userId) => {
  try {
    return await deleteDrawingSheet(id, userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:createChangeOrder", async (event, data) => {
  try {
    return await createChangeOrder(data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:listChangeOrders", async (event, projectId, options) => {
  try {
    return await listChangeOrders(projectId, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:updateChangeOrder", async (event, id, data) => {
  try {
    return await updateChangeOrder(id, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:deleteChangeOrder", async (event, id, userId) => {
  try {
    return await deleteChangeOrder(id, userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:createContract", async (event, data) => {
  try {
    return await createContract(data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:listContracts", async (event, projectId, options) => {
  try {
    return await listContracts(projectId, options);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:updateContract", async (event, id, data) => {
  try {
    return await updateContract(id, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:deleteContract", async (event, id, userId) => {
  try {
    return await deleteContract(id, userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:calculateAutomatedSOV", async (event, projectId) => {
  try {
    return await calculateAutomatedSOV(projectId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:recalculateProjectBudget", async (event, projectId) => {
  try {
    return await recalculateProjectBudget(projectId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:recalculateProjectTotals", async (event, projectId) => {
  try {
    return await recalculateProjectTotals(projectId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:getProjectFinancialSummary", async (event, projectId) => {
  try {
    return await getProjectFinancialSummary(projectId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:updateProjectContractValue", async (event, projectId, originalValue) => {
  try {
    return await updateProjectContractValue(projectId, originalValue);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:setUserPreference", async (event, userId, key, value) => {
  try {
    return await setUserPreference(userId, key, value);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:getUserPreference", async (event, userId, key) => {
  try {
    return await getUserPreference(userId, key);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:getAllUserPreferences", async (event, userId) => {
  try {
    return await getAllUserPreferences(userId);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:deleteUserPreference", async (event, userId, key) => {
  try {
    return await deleteUserPreference(userId, key);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:computePortfolioMarginAtRisk", async (event, projectIds) => {
  try {
    return await computePortfolioMarginAtRisk(projectIds);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:updateProject", async (event, id, data) => {
  try {
    return await updateProject(id, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("db:listProjects", async (event, options) => {
  try {
    return await listProjects(options);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

