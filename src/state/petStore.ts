import { create } from "zustand";
import {
  clearMessages as clearStoredMessages,
  defaultSettings,
  loadMessages,
  loadSettings,
  saveMessages,
  saveSettings
} from "../lib/storage";
import type { ChatMessage, PetAction, PetEmotion, PetSettings } from "../types/pet";

const initialGreeting = "こんにちは。そばにいます。何から始めますか？";

type PetState = {
  emotion: PetEmotion;
  action: PetAction;
  bubbleText: string;
  messages: ChatMessage[];
  settings: PetSettings;
  isSettingsOpen: boolean;
  isLoading: boolean;
  setEmotion: (emotion: PetEmotion, action?: PetAction) => void;
  setBubbleText: (text: string) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => ChatMessage;
  clearMessages: () => void;
  setSettings: (settings: Partial<PetSettings>) => void;
  setSettingsOpen: (open: boolean) => void;
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

function getInitialMessages(): ChatMessage[] {
  const savedMessages = loadMessages();

  if (savedMessages.length > 0) {
    return savedMessages;
  }

  return [
    createMessage({
      role: "pet",
      text: initialGreeting
    })
  ];
}

export const usePetStore = create<PetState>((set, get) => {
  const messages = getInitialMessages();

  return {
    emotion: "idle",
    action: "none",
    bubbleText: messages.at(-1)?.text ?? initialGreeting,
    messages,
    settings: loadSettings(),
    isSettingsOpen: false,
    isLoading: false,
    setEmotion: (emotion, action = "none") => set({ emotion, action }),
    setBubbleText: (bubbleText) => set({ bubbleText }),
    addMessage: (message) => {
      const created = createMessage(message);
      const nextMessages = [...get().messages, created].slice(-80);
      saveMessages(nextMessages);
      set({ messages: nextMessages });
      return created;
    },
    clearMessages: () => {
      const nextMessages = [
        createMessage({
          role: "pet",
          text: initialGreeting
        })
      ];
      clearStoredMessages();
      saveMessages(nextMessages);
      set({
        messages: nextMessages,
        bubbleText: initialGreeting,
        emotion: "idle",
        action: "none"
      });
    },
    setSettings: (nextSettings) => {
      const settings = {
        ...get().settings,
        ...nextSettings
      };
      saveSettings(settings);
      set({ settings });
    },
    setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
    setLoading: (isLoading) => set({ isLoading }),
    resetSettings: () => {
      saveSettings(defaultSettings);
      set({ settings: defaultSettings });
    }
  };
});
