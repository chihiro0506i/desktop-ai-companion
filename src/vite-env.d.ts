/// <reference types="vite/client" />

type DesktopPetWindowMode = {
  alwaysOnTop: boolean;
  transparent: boolean;
};

type DesktopPetEmotion = "idle" | "thinking" | "talking" | "happy" | "confused" | "sleepy" | "concerned";
type DesktopPetCharacterImages = Record<DesktopPetEmotion, string>;

interface Window {
  desktopPet?: {
    getWindowMode: () => Promise<DesktopPetWindowMode>;
    setWindowMode: (mode: Partial<DesktopPetWindowMode>) => Promise<DesktopPetWindowMode>;
    selectImageFile: () => Promise<string | null>;
    selectImageFolder: () => Promise<DesktopPetCharacterImages | null>;
  };
}
