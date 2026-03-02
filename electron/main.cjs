const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = !app.isPackaged;

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
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

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

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle("get-user-data-path", () => {
  return app.getPath("userData");
});

ipcMain.handle("save-file-dialog", async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle("open-file-dialog", async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle("write-file", async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
