import type { ChatMessage, PetSettings } from "../types/pet";
import { createEmptyCharacterImages, mergeCharacterImages, normalizeImageSource, petEmotions } from "./characterImages";

const settingsKey = "local-llm-desktop-pet:settings";
const messagesKey = "local-llm-desktop-pet:messages";

export const defaultSettings: PetSettings = {
  ollamaApiUrl: "http://localhost:11434",
  modelName: "qwen3.5:2b",
  petSize: 145,
  characterName: "Desktop Pet",
  characterImages: createEmptyCharacterImages(),
  systemStyle: "短く、親しみやすく、作業を邪魔しない相棒として返答する。",
  historyLimit: 12,
  selfTalkEnabled: true,
  selfTalkIntervalMinutes: 4,
  alwaysOnTop: true,
  transparentWindow: true
};

export function loadSettings(): PetSettings {
  const raw = window.localStorage.getItem(settingsKey);

  if (!raw) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PetSettings> & { characterImageSrc?: string };
    const legacyImageSrc =
      typeof parsed.characterImageSrc === "string" ? normalizeImageSource(parsed.characterImageSrc) : "";
    const loadedImages = mergeCharacterImages(parsed.characterImages, legacyImageSrc);
    const characterImages = petEmotions.reduce(
      (images, emotion) => ({
        ...images,
        [emotion]: normalizeImageSource(loadedImages[emotion]) || defaultSettings.characterImages[emotion]
      }),
      defaultSettings.characterImages
    );

    return {
      ...defaultSettings,
      ...parsed,
      characterImages
    };
  } catch (error) {
    console.error("Failed to load settings", error);
    return defaultSettings;
  }
}

export function saveSettings(settings: PetSettings): void {
  window.localStorage.setItem(settingsKey, JSON.stringify(settings));
}

export function loadMessages(): ChatMessage[] {
  const raw = window.localStorage.getItem(messagesKey);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load messages", error);
    return [];
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  window.localStorage.setItem(messagesKey, JSON.stringify(messages));
}

export function clearMessages(): void {
  window.localStorage.removeItem(messagesKey);
}
