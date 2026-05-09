import type { ChatMessage, PetSettings } from "../types/pet";
import { createEmptyCharacterImages, mergeCharacterImages, normalizeImageSource, petEmotions } from "./characterImages";

const settingsKey = "local-llm-desktop-pet:settings";
const messagesKey = "local-llm-desktop-pet:messages";

export const defaultSettings: PetSettings = {
  aiProvider: "ollama",
  ollamaApiUrl: "http://localhost:11434",
  modelName: "qwen3.5:9b",
  externalApiUrl: "",
  externalModelName: "",
  petSize: 145,
  characterName: "Desktop Pet",
  characterImages: createEmptyCharacterImages(),
  systemStyle:
    "かわいい常駐キャラとして親しみやすさを保ちつつ、実務的な秘書として要点整理、手順化、比較、下書き作成まで丁寧に支援する。根拠が必要な話題ではWeb検索結果を使い、分からないことは断定しない。",
  historyLimit: 20,
  selfTalkEnabled: true,
  selfTalkIntervalMinutes: 1,
  webSearch: {
    enabled: false,
    provider: "searxng",
    endpoint: "http://localhost:8080",
    maxResults: 3,
    timeoutMs: 5000,
    autoSearch: false
  },
  alwaysOnTop: true,
  transparentWindow: true
};

export function loadSettings(): PetSettings {
  const raw = window.localStorage.getItem(settingsKey);

  if (!raw) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PetSettings> & {
      characterImageSrc?: string;
      externalApiKey?: unknown;
    };
    const settingsWithoutSecrets = { ...parsed };
    delete settingsWithoutSecrets.characterImageSrc;
    delete settingsWithoutSecrets.externalApiKey;
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

    const loadedSettings = {
      ...defaultSettings,
      ...settingsWithoutSecrets,
      modelName:
        parsed.modelName === "qwen3.5:2b" ? defaultSettings.modelName : parsed.modelName ?? defaultSettings.modelName,
      characterImages,
      webSearch: {
        ...defaultSettings.webSearch,
        ...(parsed.webSearch ?? {})
      }
    };

    if (Object.prototype.hasOwnProperty.call(parsed, "externalApiKey")) {
      window.localStorage.setItem(settingsKey, JSON.stringify(loadedSettings));
    }

    return loadedSettings;
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
