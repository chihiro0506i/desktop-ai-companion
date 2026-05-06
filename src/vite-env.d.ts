/// <reference types="vite/client" />

type DesktopPetWindowMode = {
  alwaysOnTop: boolean;
  transparent: boolean;
};

type DesktopPetEmotion = "idle" | "thinking" | "talking" | "happy" | "confused" | "sleepy" | "concerned";
type DesktopPetCharacterImages = Record<DesktopPetEmotion, string>;
type DesktopPetWebSearchProvider = "disabled" | "searxng" | "api";
type DesktopPetWebSearchOptions = {
  provider?: DesktopPetWebSearchProvider;
  endpoint?: string;
  maxResults?: number;
  timeoutMs?: number;
};
type DesktopPetWebSearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  fetchedAt: number;
};

interface Window {
  desktopPet?: {
    getWindowMode: () => Promise<DesktopPetWindowMode>;
    setWindowMode: (mode: Partial<DesktopPetWindowMode>) => Promise<DesktopPetWindowMode>;
    selectImageFile: () => Promise<string | null>;
    selectImageFolder: () => Promise<DesktopPetCharacterImages | null>;
    searchWeb: (query: string, options: DesktopPetWebSearchOptions) => Promise<DesktopPetWebSearchResult[]>;
  };
}
