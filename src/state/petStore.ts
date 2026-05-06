import { create } from "zustand";
import { defaultSettings, loadSettings, saveSettings } from "../lib/storage";
import type { ChatMessage, PetAction, PetEmotion, PetSettings } from "../types/pet";

type PetState = {
  emotion: PetEmotion;
  action: PetAction;
  bubbleText: string;
  messages: ChatMessage[];
  settings: PetSettings;
  isChatOpen: boolean;
  isLoading: boolean;
  setEmotion: (emotion: PetEmotion, action?: PetAction) => void;
  setBubbleText: (text: string) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => void;
  setSettings: (settings: Partial<PetSettings>) => void;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  resetSettings: () => void;
};

function createMessage(message: Omit<ChatMessage, "id" | "createdAt">): ChatMessage {
  return {
    ...message,
    id: crypto.randomUUID(),
    createdAt: Date.now()
  };
}

export const usePetStore = create<PetState>((set, get) => ({
  emotion: "idle",
  action: "none",
  bubbleText: "こんにちは。なにか手伝えることはありますか？",
  messages: [
    createMessage({
      role: "pet",
      text: "こんにちは。なにか手伝えることはありますか？"
    })
  ],
  settings: loadSettings(),
  isChatOpen: true,
  isLoading: false,
  setEmotion: (emotion, action = "none") => set({ emotion, action }),
  setBubbleText: (bubbleText) => set({ bubbleText }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages.slice(-19), createMessage(message)]
    })),
  setSettings: (nextSettings) => {
    const settings = {
      ...get().settings,
      ...nextSettings
    };
    saveSettings(settings);
    set({ settings });
  },
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  setChatOpen: (isChatOpen) => set({ isChatOpen }),
  setLoading: (isLoading) => set({ isLoading }),
  resetSettings: () => {
    saveSettings(defaultSettings);
    set({ settings: defaultSettings });
  }
}));
