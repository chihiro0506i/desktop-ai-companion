import { app, BrowserWindow, dialog, ipcMain, net, protocol, screen } from "electron";
import { readdir } from "node:fs/promises";
import isDev from "electron-is-dev";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { searchWeb, type WebSearchOptions } from "./webSearch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type WindowMode = {
  alwaysOnTop: boolean;
  transparent: boolean;
};

type PetEmotion = "idle" | "thinking" | "talking" | "happy" | "confused" | "sleepy" | "concerned";

type CharacterImages = Record<PetEmotion, string>;

const defaultWindowMode: WindowMode = {
  alwaysOnTop: true,
  transparent: true
};

let mainWindow: BrowserWindow | null = null;
let currentWindowMode = { ...defaultWindowMode };

const petEmotions: PetEmotion[] = [
  "idle",
  "thinking",
  "talking",
  "happy",
  "confused",
  "sleepy",
  "concerned"
];

function createEmptyCharacterImages(): CharacterImages {
  return {
    idle: "",
    thinking: "",
    talking: "",
    happy: "",
    confused: "",
    sleepy: "",
    concerned: ""
  };
}

function createPetImageUrl(filePath: string, scope: "app" | "local"): string {
  const normalized = filePath.replaceAll("\\", "/");
  return `pet-image://${scope}/${encodeURI(normalized)}`;
}

function isImageFilePath(filePath: string): boolean {
  return /\.(png|jpe?g|webp|gif)$/i.test(filePath);
}

function resolvePetImagePath(url: URL): string {
  const decodedPath = decodeURIComponent(url.pathname).replace(/^\/+/, "");

  if (!isImageFilePath(decodedPath)) {
    throw new Error("Only image files are allowed.");
  }

  if (url.hostname === "app") {
    const appPath = app.getAppPath();
    const resolved = path.resolve(appPath, decodedPath);
    const relative = path.relative(appPath, resolved);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("App image path must stay inside the app directory.");
    }

    return resolved;
  }

  if (url.hostname === "local") {
    const normalized = path.normalize(decodedPath);

    if (!path.isAbsolute(normalized)) {
      throw new Error("Local image path must be absolute.");
    }

    return normalized;
  }

  throw new Error("Unknown image scope.");
}

function registerPetImageProtocol(): void {
  protocol.handle("pet-image", (request) => {
    try {
      const resolved = resolvePetImagePath(new URL(request.url));
      return net.fetch(pathToFileURL(resolved).toString());
    } catch (error) {
      console.error("Blocked pet-image request", error);
      return new Response(null, { status: 404 });
    }
  });
}

async function resolveCharacterImagesFromAbsoluteFolder(resolvedFolder: string): Promise<CharacterImages> {
  const entries = await readdir(resolvedFolder, { withFileTypes: true });
  const imageFiles = entries
    .filter((entry) => entry.isFile() && /\.(png|jpe?g|webp|gif)$/i.test(entry.name))
    .slice(0, 200)
    .map((entry) => entry.name);
  const images = createEmptyCharacterImages();

  for (const emotion of petEmotions) {
    const matched = imageFiles.find((fileName) => fileName.toLowerCase().includes(emotion));

    if (matched) {
      images[emotion] = createPetImageUrl(path.join(resolvedFolder, matched), "local");
    }
  }

  return images;
}

async function selectImageFile(): Promise<string | null> {
  if (!mainWindow) {
    return null;
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: "キャラクター画像を選択",
    properties: ["openFile"],
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "webp", "gif"]
      }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return createPetImageUrl(result.filePaths[0], "local");
}

async function selectImageFolder(): Promise<CharacterImages | null> {
  if (!mainWindow) {
    return null;
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: "感情別画像フォルダを選択",
    properties: ["openDirectory"]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return resolveCharacterImagesFromAbsoluteFolder(result.filePaths[0]);
}

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

protocol.registerSchemesAsPrivileged([
  {
    scheme: "pet-image",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true
    }
  }
]);

app.whenReady().then(() => {
  registerPetImageProtocol();

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
  ipcMain.handle("images:select-file", async () => {
    return selectImageFile();
  });
  ipcMain.handle("images:select-folder", async () => {
    return selectImageFolder();
  });
  ipcMain.handle("web-search:search", async (_event, query: string, options: WebSearchOptions) => {
    return searchWeb(query, options);
  });

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
