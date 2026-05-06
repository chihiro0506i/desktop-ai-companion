export type PetEmotion =
  | "idle"
  | "happy"
  | "thinking"
  | "talking"
  | "confused"
  | "sleepy"
  | "concerned";

export type PetAction = "none" | "wave" | "jump" | "sleep" | "nod";

export type PetLLMResponse = {
  reply: string;
  emotion: PetEmotion;
  action: PetAction;
};

export type PetSettings = {
  ollamaApiUrl: string;
  modelName: string;
  petSize: number;
  alwaysOnTop: boolean;
  transparentWindow: boolean;
};

export type ChatMessage = {
  id: string;
  role: "user" | "pet";
  text: string;
  createdAt: number;
};
