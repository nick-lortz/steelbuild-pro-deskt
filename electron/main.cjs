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
  getDashboardCounts,
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
