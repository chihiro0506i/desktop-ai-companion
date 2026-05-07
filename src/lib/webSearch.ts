import type { WebSearchResult, WebSearchSettings } from "../types/pet";

export class WebSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebSearchError";
  }
}

export function extractWebSearchQuery(message: string): string | null {
  const match = message.match(/^\/web(?:\s+(.+))?$/i);

  if (!match) {
    return null;
  }

  return (match[1] ?? "").trim();
}

export function shouldAutoSearch(message: string): boolean {
  return /\b(latest|today|current|news|price|weather|version|release)\b/i.test(message)
    || /(最新|今日|現在|ニュース|価格|天気|バージョン|リリース)/.test(message);
}

export function formatSearchReferences(results: WebSearchResult[]): string {
  return results
    .map((result, index) => `[${index + 1}] ${result.title} ${result.url}`)
    .join("\n");
}

export function getDesktopPetApiStatus(): string {
  if (!window.desktopPet) {
    return "Desktop APIなし。Electronアプリではなくブラウザで開いている可能性があります。";
  }

  const apiInfo = window.desktopPet.getApiInfo?.();
  const capabilities = apiInfo?.capabilities ?? [];

  if (!window.desktopPet.searchWeb || !capabilities.includes("web-search")) {
    return "Desktop APIは古い状態です。Electronを完全終了して npm run dev で起動し直してください。";
  }

  return `Desktop API OK (${apiInfo?.version ?? "unknown"})`;
}

function normalizeSearchErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/Search query is empty/i.test(message)) {
    return "検索語を入力してください。";
  }

  if (/Search endpoint is not configured|Invalid URL/i.test(message)) {
    return "Search Endpointを設定してください。";
  }

  if (/Search endpoint must be https or local http/i.test(message)) {
    return "Endpointは https:// または http://localhost / http://127.0.0.1 のみ許可しています。";
  }

  if (/Web search is disabled/i.test(message)) {
    return "Web検索はOFFです。設定のSearchタブで有効にしてください。";
  }

  if (/API search provider is not implemented/i.test(message)) {
    return "API Providerはまだ未実装です。SearXNGを選んでください。";
  }

  if (/Search provider returned/i.test(message)) {
    return "検索Endpointがエラーを返しました。SearXNGの設定を確認してください。";
  }

  if (/abort|timeout|timed out/i.test(message)) {
    return "検索Endpointがタイムアウトしました。SearXNGが応答しているか確認してください。";
  }

  if (/fetch failed|ECONNREFUSED|ERR_CONNECTION_REFUSED|Could not connect|Failed to fetch|network/i.test(message)) {
    return "検索Endpointに接続できません。SearXNGが起動しているか確認してください。";
  }

  console.error("Web search failed", error);
  return "Web検索に失敗しました。通常の会話として返します。";
}

export async function searchWeb(query: string, settings: WebSearchSettings): Promise<WebSearchResult[]> {
  if (!settings.enabled) {
    throw new WebSearchError("Web検索はOFFです。設定のSearchタブで有効にしてください。");
  }

  if (settings.provider === "disabled") {
    throw new WebSearchError("検索プロバイダが無効です。");
  }

  if (!query.trim()) {
    throw new WebSearchError("検索語を入力してください。");
  }

  if (!window.desktopPet?.searchWeb) {
    throw new WebSearchError(getDesktopPetApiStatus());
  }

  try {
    const results = await window.desktopPet.searchWeb(query, {
      provider: settings.provider,
      endpoint: settings.endpoint,
      maxResults: settings.maxResults,
      timeoutMs: settings.timeoutMs
    });

    if (results.length === 0) {
      throw new WebSearchError("検索結果が見つかりませんでした。");
    }

    return results;
  } catch (error) {
    if (error instanceof WebSearchError) {
      throw error;
    }

    throw new WebSearchError(normalizeSearchErrorMessage(error));
  }
}
