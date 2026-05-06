/// <reference types="vite/client" />

type DesktopPetWindowMode = {
  alwaysOnTop: boolean;
  transparent: boolean;
};

interface Window {
  desktopPet?: {
    getWindowMode: () => Promise<DesktopPetWindowMode>;
    setWindowMode: (mode: Partial<DesktopPetWindowMode>) => Promise<DesktopPetWindowMode>;
  };
}
