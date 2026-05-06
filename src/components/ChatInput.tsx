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

async function resolveImageFolderCommand(commandBody: string): Promise<ImageCommandResult> {
  const folderPath = commandBody.replace(/^folder\s+/i, "").trim();

  if (!folderPath) {
    return {
      images: createEmptyCharacterImages(),
      reply: "使い方: /image folder private-images",
      ok: false
    };
  }

  if (!window.desktopPet?.resolveImageFolder) {
    return {
      images: createEmptyCharacterImages(),
      reply: "画像フォルダの読み取りAPIが利用できません。",
      ok: false
    };
  }

  try {
    const images = await window.desktopPet.resolveImageFolder(folderPath);
    const foundEmotions = petEmotions.filter((emotion) => images[emotion]);
    const missingEmotions = petEmotions.filter((emotion) => !images[emotion]);

    if (foundEmotions.length === 0) {
      return {
        images,
        reply: "指定フォルダ内に感情名を含む画像ファイルが見つかりませんでした。",
        ok: false
      };
    }

    return {
      images,
      reply:
        missingEmotions.length > 0
          ? `画像を${foundEmotions.length}件読み込みました。不足: ${missingEmotions.join(", ")}`
          : "すべての感情画像を読み込みました。",
      ok: true
    };
  } catch (error) {
    console.error("Failed to resolve image folder", error);
    return {
      images: createEmptyCharacterImages(),
      reply: "画像フォルダを読み取れませんでした。パスを確認してください。",
      ok: false
    };
  }
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
      const commandBody = message.slice(7).trim();
      const result = commandBody.toLowerCase().startsWith("folder ")
        ? await resolveImageFolderCommand(commandBody)
        : parseImageCommand(commandBody, settings.characterImages);

      addMessage({ role: "user", text: message });
      addMessage({ role: "pet", text: result.reply });
      setSettings({
        characterImages: result.ok
          ? {
              ...settings.characterImages,
              ...result.images
            }
          : settings.characterImages
      });
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
