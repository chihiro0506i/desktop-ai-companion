import { contextBridge, ipcRenderer } from "electron";

type WindowMode = {
  alwaysOnTop: boolean;
  transparent: boolean;
};

type PetEmotion = "idle" | "thinking" | "talking" | "happy" | "confused" | "sleepy" | "concerned";
type CharacterImages = Record<PetEmotion, string>;
type WebSearchProvider = "disabled" | "searxng" | "api";
type WebSearchOptions = {
  provider?: WebSearchProvider;
  endpoint?: string;
  maxResults?: number;
  timeoutMs?: number;
};
type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  fetchedAt: number;
};

contextBridge.exposeInMainWorld("desktopPet", {
  getWindowMode: (): Promise<WindowMode> => ipcRenderer.invoke("window:get-mode"),
  setWindowMode: (mode: Partial<WindowMode>): Promise<WindowMode> =>
    ipcRenderer.invoke("window:set-mode", mode),
  selectImageFile: (): Promise<string | null> => ipcRenderer.invoke("images:select-file"),
  selectImageFolder: (): Promise<CharacterImages | null> => ipcRenderer.invoke("images:select-folder"),
  searchWeb: (query: string, options: WebSearchOptions): Promise<WebSearchResult[]> =>
    ipcRenderer.invoke("web-search:search", query, options)
});
