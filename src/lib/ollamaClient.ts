import { buildPetPrompt, buildSelfTalkPrompt } from "./petPrompt";
import type { ChatMessage, PetAction, PetEmotion, PetLLMResponse, PetSettings, WebSearchResult } from "../types/pet";

type OllamaGenerateResponse = {
  response?: string;
  thinking?: string;
  error?: string;
};

type OllamaTagsResponse = {
  models?: Array<{
    name?: string;
    model?: string;
  }>;
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

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

export async function listOllamaModels(
  settings: Pick<PetSettings, "ollamaApiUrl">
): Promise<string[]> {
  const endpoint = `${stripTrailingSlash(settings.ollamaApiUrl)}/api/tags`;

  let response: Response;

  try {
    response = await fetch(endpoint);
  } catch (error) {
    console.error("Ollama model list failed", error);
    throw new OllamaError("Ollamaに接続できません。API URLと起動状態を確認してください。");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Ollama model list API error", response.status, detail);
    throw new OllamaError("Ollamaのモデル一覧を取得できませんでした。");
  }

  const data = (await response.json()) as OllamaTagsResponse;
  return (data.models ?? [])
    .map((model) => model.name ?? model.model ?? "")
    .filter((name): name is string => name.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));
}

export async function testOllamaConnection(settings: Pick<PetSettings, "ollamaApiUrl">): Promise<void> {
  await listOllamaModels(settings);
}

export async function listExternalModels(
  settings: Pick<PetSettings, "externalApiUrl" | "externalModelName">
): Promise<string[]> {
  if (!window.desktopPet?.listExternalModels) {
    throw new OllamaError("外部API機能が利用できません。アプリを再起動してください。");
  }

  try {
    return await window.desktopPet.listExternalModels({
      apiUrl: settings.externalApiUrl,
      model: settings.externalModelName
    });
  } catch {
    throw new OllamaError("外部APIのモデル一覧を取得できませんでした。API URL、API Key、ネットワーク状態を確認してください。");
  }
}

export async function askOllama(
  userMessage: string,
  settings: Pick<
    PetSettings,
    | "aiProvider"
    | "ollamaApiUrl"
    | "modelName"
    | "externalApiUrl"
    | "externalModelName"
    | "characterName"
    | "systemStyle"
    | "historyLimit"
  >,
  history: ChatMessage[],
  webSearchResults?: WebSearchResult[]
): Promise<PetLLMResponse> {
  if (settings.aiProvider === "openai-compatible") {
    return askOpenAiCompatible(userMessage, settings, history, webSearchResults);
  }

  const endpoint = `${stripTrailingSlash(settings.ollamaApiUrl)}/api/generate`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: settings.modelName,
        prompt: buildPetPrompt(userMessage, settings, history, webSearchResults),
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

async function askOpenAiCompatible(
  userMessage: string,
  settings: Pick<
    PetSettings,
    | "externalApiUrl"
    | "externalModelName"
    | "characterName"
    | "systemStyle"
    | "historyLimit"
  >,
  history: ChatMessage[],
  webSearchResults?: WebSearchResult[]
): Promise<PetLLMResponse> {
  if (!settings.externalModelName.trim()) {
    throw new OllamaError("外部APIのモデル名を設定してください。");
  }

  const prompt = buildPetPrompt(userMessage, settings, history, webSearchResults);

  if (!window.desktopPet?.requestExternalChat) {
    throw new OllamaError("外部API機能が利用できません。アプリを再起動してください。");
  }

  try {
    const content = await window.desktopPet.requestExternalChat({
      apiUrl: settings.externalApiUrl,
      model: settings.externalModelName,
      prompt,
      jsonMode: true
    });

    return parsePetResponse(content);
  } catch {
    throw new OllamaError("外部APIから応答を取得できませんでした。API URL、API Key、モデル名を確認してください。");
  }
}

export async function askSelfTalkOllama(
  settings: Pick<
    PetSettings,
    | "aiProvider"
    | "ollamaApiUrl"
    | "modelName"
    | "externalApiUrl"
    | "externalModelName"
    | "characterName"
    | "systemStyle"
    | "historyLimit"
  >,
  history: ChatMessage[]
): Promise<PetLLMResponse> {
  if (settings.aiProvider === "openai-compatible") {
    throw new OllamaError("外部API利用中は自動独り言を送信しません。");
  }

  const endpoint = `${stripTrailingSlash(settings.ollamaApiUrl)}/api/generate`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: settings.modelName,
        prompt: buildSelfTalkPrompt(settings, history),
        stream: false,
        format: "json",
        think: false
      })
    });
  } catch (error) {
    console.error("Ollama self-talk connection failed", error);
    throw new OllamaError("Ollamaに接続できません。");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Ollama self-talk API error", response.status, detail);
    throw new OllamaError("Ollamaから独り言を取得できませんでした。");
  }

  const data = (await response.json()) as OllamaGenerateResponse;

  if (data.error) {
    console.error("Ollama returned self-talk error", data.error);
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
        : "返答を組み立てられませんでした。もう一度話しかけてください。";
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
