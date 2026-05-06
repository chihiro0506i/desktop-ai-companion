import { contextBridge, ipcRenderer } from "electron";

type WindowMode = {
  alwaysOnTop: boolean;
  transparent: boolean;
};

type PetEmotion = "idle" | "thinking" | "talking" | "happy" | "confused" | "sleepy" | "concerned";
type CharacterImages = Record<PetEmotion, string>;

contextBridge.exposeInMainWorld("desktopPet", {
  getWindowMode: (): Promise<WindowMode> => ipcRenderer.invoke("window:get-mode"),
  setWindowMode: (mode: Partial<WindowMode>): Promise<WindowMode> =>
    ipcRenderer.invoke("window:set-mode", mode),
  resolveImageFolder: (folderPath: string): Promise<CharacterImages> =>
    ipcRenderer.invoke("images:resolve-folder", folderPath)
});
