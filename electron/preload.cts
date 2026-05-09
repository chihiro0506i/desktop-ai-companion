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
type ExternalApiOptions = {
  apiUrl?: string;
  model?: string;
};
type ExternalChatOptions = ExternalApiOptions & {
  prompt?: string;
  jsonMode?: boolean;
};

contextBridge.exposeInMainWorld("desktopPet", {
  getApiInfo: () => ({
    version: "2026-05-07-web-search",
    capabilities: ["window", "images", "web-search", "external-api"]
  }),
  getWindowMode: (): Promise<WindowMode> => ipcRenderer.invoke("window:get-mode"),
  setWindowMode: (mode: Partial<WindowMode>): Promise<WindowMode> =>
    ipcRenderer.invoke("window:set-mode", mode),
  selectImageFile: (): Promise<string | null> => ipcRenderer.invoke("images:select-file"),
  selectImageFolder: (): Promise<CharacterImages | null> => ipcRenderer.invoke("images:select-folder"),
  searchWeb: (query: string, options: WebSearchOptions): Promise<WebSearchResult[]> =>
    ipcRenderer.invoke("web-search:search", query, options),
  setExternalApiKey: (apiKey: string): Promise<boolean> => ipcRenderer.invoke("external-api:set-key", apiKey),
  clearExternalApiKey: (): Promise<void> => ipcRenderer.invoke("external-api:clear-key"),
  hasExternalApiKey: (): Promise<boolean> => ipcRenderer.invoke("external-api:has-key"),
  listExternalModels: (options: ExternalApiOptions): Promise<string[]> =>
    ipcRenderer.invoke("external-api:list-models", options),
  requestExternalChat: (options: ExternalChatOptions): Promise<string> =>
    ipcRenderer.invoke("external-api:chat", options)
});
