export type PetEmotion =
  | "idle"
  | "happy"
  | "thinking"
  | "talking"
  | "confused"
  | "sleepy"
  | "concerned";

export type PetAction = "none" | "wave" | "jump" | "sleep" | "nod";

export type CharacterImages = Record<PetEmotion, string>;

export type AiProvider = "ollama" | "openai-compatible";

export type WebSearchProvider = "disabled" | "searxng" | "api";

export type WebSearchSettings = {
  enabled: boolean;
  provider: WebSearchProvider;
  endpoint: string;
  maxResults: number;
  timeoutMs: number;
  autoSearch: boolean;
};

export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  fetchedAt: number;
};

export type PetLLMResponse = {
  reply: string;
  emotion: PetEmotion;
  action: PetAction;
};

export type PetSettings = {
  aiProvider: AiProvider;
  ollamaApiUrl: string;
  modelName: string;
  externalApiUrl: string;
  externalModelName: string;
  petSize: number;
  characterName: string;
  characterImages: CharacterImages;
  systemStyle: string;
  historyLimit: number;
  selfTalkEnabled: boolean;
  selfTalkIntervalMinutes: number;
  webSearch: WebSearchSettings;
  alwaysOnTop: boolean;
  transparentWindow: boolean;
};

export type ChatMessage = {
  id: string;
  role: "user" | "pet";
  text: string;
  createdAt: number;
  sources?: WebSearchResult[];
};
