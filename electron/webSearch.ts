export type WebSearchProvider = "disabled" | "searxng" | "api";

export type WebSearchOptions = {
  provider?: WebSearchProvider;
  endpoint?: string;
  maxResults?: number;
  timeoutMs?: number;
};

export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  fetchedAt: number;
};

type SearxngResult = {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  engine?: unknown;
  engines?: unknown;
};

type SearxngResponse = {
  results?: unknown;
};

const maxSearchQueryLength = 300;
const maxSnippetLength = 240;

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeSearchQuery(query: unknown): string {
  if (typeof query !== "string") {
    throw new Error("Search query must be a string.");
  }

  const trimmed = query.trim().slice(0, maxSearchQueryLength);

  if (!trimmed) {
    throw new Error("Search query is empty.");
  }

  return trimmed;
}

function validateSearchEndpoint(endpoint: unknown): URL {
  if (typeof endpoint !== "string" || !endpoint.trim()) {
    throw new Error("Search endpoint is not configured.");
  }

  const url = new URL(endpoint.trim());
  const isLocalProtocol = url.protocol === "http:" || url.protocol === "https:";
  const isLocalHost =
    url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1" || url.hostname === "[::1]";

  if (!isLocalProtocol || !isLocalHost) {
    throw new Error("Search endpoint must be local http or local https.");
  }

  url.username = "";
  url.password = "";
  url.hash = "";

  return url;
}

function createSearxngSearchUrl(endpoint: URL, query: string): string {
  const searchUrl = new URL(endpoint.toString());

  if (!searchUrl.pathname.endsWith("/search")) {
    searchUrl.pathname = `${searchUrl.pathname.replace(/\/$/, "")}/search`;
  }

  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("format", "json");

  return searchUrl.toString();
}

function getSearchSource(result: SearxngResult): string {
  if (typeof result.engine === "string" && result.engine.trim()) {
    return result.engine.trim();
  }

  if (Array.isArray(result.engines)) {
    return result.engines.filter((engine): engine is string => typeof engine === "string").join(", ");
  }

  return "web";
}

function compactText(value: string, maxLength: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeResultUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return "";
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "";
  }

  url.username = "";
  url.password = "";
  url.hash = "";

  return url.toString().slice(0, 300);
}

function normalizeSearxngResults(data: SearxngResponse, maxResults: number): WebSearchResult[] {
  const rawResults = Array.isArray(data.results) ? (data.results as SearxngResult[]) : [];
  const fetchedAt = Date.now();

  return rawResults
    .map((result) => {
      const title = typeof result.title === "string" ? compactText(result.title, 120) : "";
      const rawUrl = typeof result.url === "string" ? result.url.trim() : "";
      const snippet = typeof result.content === "string" ? compactText(result.content, maxSnippetLength) : "";
      const url = rawUrl ? normalizeResultUrl(rawUrl) : "";

      if (!title || !url) {
        return null;
      }

      return {
        title,
        url,
        snippet,
        source: compactText(getSearchSource(result), 80),
        fetchedAt
      };
    })
    .filter((result): result is WebSearchResult => Boolean(result))
    .slice(0, maxResults);
}

export async function searchWeb(query: unknown, options: WebSearchOptions): Promise<WebSearchResult[]> {
  const normalizedQuery = normalizeSearchQuery(query);
  const provider = options.provider ?? "disabled";
  const maxResults = clampNumber(options.maxResults, 1, 5, 3);
  const timeoutMs = clampNumber(options.timeoutMs, 1000, 10000, 5000);

  if (provider === "disabled") {
    throw new Error("Web search is disabled.");
  }

  if (provider === "api") {
    throw new Error("API search provider is not implemented yet.");
  }

  if (provider !== "searxng") {
    throw new Error("Unknown search provider.");
  }

  const endpoint = validateSearchEndpoint(options.endpoint);
  const searchUrl = createSearxngSearchUrl(endpoint, normalizedQuery);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(searchUrl, {
      headers: {
        Accept: "application/json"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Search provider returned ${response.status}.`);
    }

    const data = (await response.json()) as SearxngResponse;
    return normalizeSearxngResults(data, maxResults);
  } finally {
    clearTimeout(timeout);
  }
}
