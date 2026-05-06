import { app, BrowserWindow, ipcMain, screen } from "electron";
import isDev from "electron-is-dev";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type WindowMode = {
  alwaysOnTop: boolean;
  transparent: boolean;
};

const defaultWindowMode: WindowMode = {
  alwaysOnTop: true,
  transparent: true
};

let mainWindow: BrowserWindow | null = null;
let currentWindowMode = { ...defaultWindowMode };

function createWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 340,
    height: 430,
    x: Math.max(width - 360, 0),
    y: Math.max(height - 460, 0),
    frame: false,
    transparent: currentWindowMode.transparent,
    alwaysOnTop: currentWindowMode.alwaysOnTop,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  mainWindow.setAlwaysOnTop(currentWindowMode.alwaysOnTop, "floating");
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  ipcMain.handle("window:set-mode", (_event, mode: Partial<WindowMode>) => {
    currentWindowMode = {
      ...currentWindowMode,
      ...mode
    };

    if (mainWindow) {
      mainWindow.setAlwaysOnTop(currentWindowMode.alwaysOnTop, "floating");
      mainWindow.setSkipTaskbar(true);
    }

    return currentWindowMode;
  });

  ipcMain.handle("window:get-mode", () => currentWindowMode);

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
