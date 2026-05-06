import { contextBridge, ipcRenderer } from "electron";

type WindowMode = {
  alwaysOnTop: boolean;
  transparent: boolean;
};

contextBridge.exposeInMainWorld("desktopPet", {
  getWindowMode: (): Promise<WindowMode> => ipcRenderer.invoke("window:get-mode"),
  setWindowMode: (mode: Partial<WindowMode>): Promise<WindowMode> =>
    ipcRenderer.invoke("window:set-mode", mode)
});
