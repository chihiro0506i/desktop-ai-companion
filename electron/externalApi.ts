type ExternalApiOptions = {
  apiUrl?: string;
  model?: string;
};

export type ExternalChatOptions = ExternalApiOptions & {
  prompt?: string;
  jsonMode?: boolean;
};

type OpenAiModelsResponse = {
  data?: Array<{
    id?: string;
  }>;
};

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

let externalApiKey = "";

function normalizeExternalApiUrl(apiUrl: unknown, path: "models" | "chat/completions"): string {
  if (typeof apiUrl !== "string" || !apiUrl.trim()) {
    throw new Error("External API URL is not configured.");
  }

  const url = new URL(apiUrl.trim());
  const isHttps = url.protocol === "https:";
  const isLocalHttp =
    url.protocol === "http:" &&
    (url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1" ||
      url.hostname === "[::1]");

  if (!isHttps && !isLocalHttp) {
    throw new Error("External API URL must be https or local http.");
  }

  url.username = "";
  url.password = "";
  url.hash = "";

  if (!url.pathname.endsWith(`/${path}`)) {
    url.pathname = `${url.pathname.replace(/\/$/, "")}/${path}`;
  }

  return url.toString();
}

function createHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(externalApiKey
      ? {
          Authorization: `Bearer ${externalApiKey}`
        }
      : {})
  };
}

function getModel(options: ExternalApiOptions): string {
  if (typeof options.model !== "string" || !options.model.trim()) {
    throw new Error("External API model is not configured.");
  }

  return options.model.trim();
}

async function postChatCompletion(endpoint: string, body: unknown): Promise<Response> {
  return fetch(endpoint, {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify(body)
  });
}

export function setExternalApiKey(value: unknown): boolean {
  externalApiKey = typeof value === "string" ? value.trim() : "";
  return Boolean(externalApiKey);
}

export function clearExternalApiKey(): void {
  externalApiKey = "";
}

export function hasExternalApiKey(): boolean {
  return Boolean(externalApiKey);
}

export async function listExternalModels(options: ExternalApiOptions): Promise<string[]> {
  const endpoint = normalizeExternalApiUrl(options.apiUrl, "models");

  let response: Response;

  try {
    response = await fetch(endpoint, {
      headers: createHeaders()
    });
  } catch {
    throw new Error("External API connection failed.");
  }

  if (!response.ok) {
    throw new Error(`External API returned ${response.status}.`);
  }

  const data = (await response.json()) as OpenAiModelsResponse;
  return (data.data ?? [])
    .map((model) => model.id ?? "")
    .filter((id): id is string => id.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));
}

export async function requestExternalChat(options: ExternalChatOptions): Promise<string> {
  const endpoint = normalizeExternalApiUrl(options.apiUrl, "chat/completions");
  const model = getModel(options);

  if (typeof options.prompt !== "string" || !options.prompt.trim()) {
    throw new Error("External API prompt is empty.");
  }

  const body = {
    model,
    messages: [
      {
        role: "system",
        content: "You are an assistant runtime. Return only a valid JSON object for the app UI."
      },
      {
        role: "user",
        content: options.prompt
      }
    ]
  };

  let response: Response;

  try {
    response = await postChatCompletion(endpoint, {
      ...body,
      ...(options.jsonMode
        ? {
            response_format: {
              type: "json_object"
            }
          }
        : {})
    });

    if (!response.ok && options.jsonMode && response.status === 400) {
      response = await postChatCompletion(endpoint, body);
    }
  } catch {
    throw new Error("External API connection failed.");
  }

  if (!response.ok) {
    throw new Error(`External API returned ${response.status}.`);
  }

  const data = (await response.json()) as OpenAiChatResponse;

  if (data.error?.message) {
    throw new Error("External API returned an error.");
  }

  const content = data.choices?.[0]?.message?.content?.trim() ?? "";

  if (!content) {
    throw new Error("External API returned an empty response.");
  }

  return content;
}
