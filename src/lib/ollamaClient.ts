import { buildPetPrompt } from "./petPrompt";
import type { ChatMessage, PetAction, PetEmotion, PetLLMResponse, PetSettings } from "../types/pet";

type OllamaGenerateResponse = {
  response?: string;
  thinking?: string;
  error?: string;
};

const validEmotions = new Set<PetEmotion>([
  "idle",
  "happy",
  "thinking",
  "talking",
  "confused",
  "sleepy",
  "concerned"
]);

const validActions = new Set<PetAction>(["none", "wave", "jump", "sleep", "nod"]);

export class OllamaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OllamaError";
  }
}

export async function askOllama(
  userMessage: string,
  settings: Pick<
    PetSettings,
    "ollamaApiUrl" | "modelName" | "characterName" | "systemStyle" | "historyLimit"
  >,
  history: ChatMessage[]
): Promise<PetLLMResponse> {
  const endpoint = `${settings.ollamaApiUrl.replace(/\/$/, "")}/api/generate`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: settings.modelName,
        prompt: buildPetPrompt(userMessage, settings, history),
        stream: false,
        format: "json",
        think: false
      })
    });
  } catch (error) {
    console.error("Ollama connection failed", error);
    throw new OllamaError("Ollamaに接続できません。Ollamaが起動しているか確認してください。");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Ollama API error", response.status, detail);
    throw new OllamaError("Ollamaから応答を取得できませんでした。API URLとモデル名を確認してください。");
  }

  const data = (await response.json()) as OllamaGenerateResponse;

  if (data.error) {
    console.error("Ollama returned error", data.error);
    throw new OllamaError(`Ollamaでエラーが発生しました: ${data.error}`);
  }

  return parsePetResponse(data.response ?? "");
}

export function parsePetResponse(rawResponse: string): PetLLMResponse {
  const trimmed = rawResponse.trim();

  try {
    const parsed = JSON.parse(trimmed) as Partial<PetLLMResponse>;
    const reply =
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply
        : "短く返す言葉を見つけられませんでした。もう一度話しかけてください。";
    const emotion = validEmotions.has(parsed.emotion as PetEmotion)
      ? (parsed.emotion as PetEmotion)
      : "talking";
    const action = validActions.has(parsed.action as PetAction) ? (parsed.action as PetAction) : "none";

    return {
      reply,
      emotion,
      action
    };
  } catch (error) {
    console.error("Failed to parse pet JSON response", error, rawResponse);
    return {
      reply: trimmed || "うまく返事を読み取れませんでした。",
      emotion: "talking",
      action: "none"
    };
  }
}
