import type { PetSettings } from "../types/pet";

const settingsKey = "local-llm-desktop-pet:settings";

export const defaultSettings: PetSettings = {
  ollamaApiUrl: "http://localhost:11434",
  modelName: "qwen3.5:2b",
  petSize: 160,
  alwaysOnTop: true,
  transparentWindow: true
};

export function loadSettings(): PetSettings {
  const raw = window.localStorage.getItem(settingsKey);

  if (!raw) {
    return defaultSettings;
  }

  try {
    return {
      ...defaultSettings,
      ...JSON.parse(raw)
    };
  } catch (error) {
    console.error("Failed to load settings", error);
    return defaultSettings;
  }
}

export function saveSettings(settings: PetSettings): void {
  window.localStorage.setItem(settingsKey, JSON.stringify(settings));
}
