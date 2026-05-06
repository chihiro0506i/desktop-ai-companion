import { FormEvent, useState } from "react";
import { askOllama, OllamaError } from "../lib/ollamaClient";
import {
  createEmptyCharacterImages,
  normalizeImageSource,
  petEmotionLabels,
  petEmotions
} from "../lib/characterImages";
import { usePetStore } from "../state/petStore";
import type { CharacterImages, PetEmotion } from "../types/pet";

type ImageCommandResult = {
  images: CharacterImages;
  reply: string;
  ok: boolean;
};

function parseImageCommand(commandBody: string, currentImages: CharacterImages): ImageCommandResult {
  const trimmed = commandBody.trim();

  if (!trimmed) {
    return {
      images: currentImages,
      reply: "使い方: /image all 画像URL または /image happy 画像URL",
      ok: false
    };
  }

  const [targetCandidate = "", ...rest] = trimmed.split(/\s+/);
  const normalizedTarget = targetCandidate.toLowerCase();

  if (normalizedTarget === "all") {
    const imageSrc = normalizeImageSource(rest.join(" "));

    return {
      images: imageSrc ? createEmptyCharacterImages(imageSrc) : currentImages,
      reply: imageSrc
        ? "すべての感情画像を変更しました。"
        : "all の後に画像URLまたはfileパスを指定してください。",
      ok: Boolean(imageSrc)
    };
  }

  if (petEmotions.includes(normalizedTarget as PetEmotion)) {
    const emotion = normalizedTarget as PetEmotion;
    const imageSrc = normalizeImageSource(rest.join(" "));

    return {
      images: imageSrc
        ? {
            ...currentImages,
            [emotion]: imageSrc
          }
        : currentImages,
      reply: imageSrc
        ? `${petEmotionLabels[emotion]} の画像を変更しました。`
        : `${emotion} の後に画像URLまたはfileパスを指定してください。`,
      ok: Boolean(imageSrc)
    };
  }

  const imageSrc = normalizeImageSource(trimmed);

  return {
    images: imageSrc ? createEmptyCharacterImages(imageSrc) : currentImages,
    reply: imageSrc
      ? "すべての感情画像を変更しました。"
      : "画像URLまたはfileパスを指定してください。",
    ok: Boolean(imageSrc)
  };
}

export function ChatInput() {
  const [input, setInput] = useState("");
  const addMessage = usePetStore((state) => state.addMessage);
  const messages = usePetStore((state) => state.messages);
  const setBubbleText = usePetStore((state) => state.setBubbleText);
  const setEmotion = usePetStore((state) => state.setEmotion);
  const setLoading = usePetStore((state) => state.setLoading);
  const setSettings = usePetStore((state) => state.setSettings);
  const isLoading = usePetStore((state) => state.isLoading);
  const settings = usePetStore((state) => state.settings);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();

    if (!message || isLoading) {
      return;
    }

    setInput("");

    if (message.toLowerCase().startsWith("/image ")) {
      const result = parseImageCommand(message.slice(7), settings.characterImages);

      addMessage({ role: "user", text: message });
      addMessage({ role: "pet", text: result.reply });
      setSettings({ characterImages: result.images });
      setBubbleText(result.reply);
      setEmotion(result.ok ? "happy" : "confused", result.ok ? "wave" : "none");
      return;
    }

    const userMessage = addMessage({ role: "user", text: message });
    setBubbleText("考えています...");
    setEmotion("thinking", "nod");
    setLoading(true);

    try {
      const result = await askOllama(message, settings, [...messages, userMessage]);
      addMessage({ role: "pet", text: result.reply });
      setBubbleText(result.reply);
      setEmotion(result.emotion, result.action);
    } catch (error) {
      const fallback =
        error instanceof OllamaError
          ? error.message
          : "返答中に問題が起きました。Ollamaの状態を確認してください。";

      console.error("Chat request failed", error);
      addMessage({ role: "pet", text: fallback });
      setBubbleText(fallback);
      setEmotion("confused", "none");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        aria-label="ペットへ話しかける"
        value={input}
        placeholder="話しかける... /image happy 画像URL"
        disabled={isLoading}
        onChange={(event) => setInput(event.target.value)}
        onFocus={() => setEmotion("idle")}
      />
      <button type="submit" disabled={!input.trim() || isLoading}>
        {isLoading ? "..." : "送信"}
      </button>
    </form>
  );
}
