import type { ChatMessage, PetSettings, WebSearchResult } from "../types/pet";

function formatWebSearchContext(results: WebSearchResult[] | undefined): string {
  if (!results || results.length === 0) {
    return "";
  }

  const formattedResults = results
    .map(
      (result, index) => `[${index + 1}]
title: ${result.title}
url: ${result.url}
snippet: ${result.snippet || "なし"}
source: ${result.source}
fetchedAt: ${new Date(result.fetchedAt).toISOString()}`
    )
    .join("\n\n");

  return `
Web検索結果:
${formattedResults}

Web検索結果を使う場合のルール:
- 検索結果に基づく場合は，文末に [1] のような参照番号を短く含めてください。
- 検索結果にないことは断定しないでください。
- 古い可能性がある情報は，不確実と述べてください。
- 返答は短くしてください。
`;
}

export function buildPetPrompt(
  userMessage: string,
  settings: Pick<PetSettings, "characterName" | "systemStyle" | "historyLimit">,
  history: ChatMessage[],
  webSearchResults?: WebSearchResult[]
): string {
  const recentHistory = history
    .slice(-settings.historyLimit)
    .map((message) => `${message.role === "user" ? "User" : "Pet"}: ${message.text}`)
    .join("\n");

  return `
あなたはPCのデスクトップに住む小さなAIキャラクター「${settings.characterName}」です。
性格と口調: ${settings.systemStyle}

ユーザーの作業を邪魔しすぎず、短く自然に返答してください。
会話履歴を踏まえて、前後の文脈がつながるように返答してください。

必ず次のJSON形式だけで返してください。
Markdownや説明文は出力しないでください。

{
  "reply": "ユーザーに表示する短い返答文",
  "emotion": "idle | happy | thinking | confused | sleepy | concerned",
  "action": "none | wave | jump | sleep | nod"
}

emotionとactionは、ユーザーの発言と会話の流れに自然に合うものを選んでください。

会話履歴:
${recentHistory || "なし"}

${formatWebSearchContext(webSearchResults)}

ユーザーの最新発言:
${userMessage}
`;
}

export function buildSelfTalkPrompt(
  settings: Pick<PetSettings, "characterName" | "systemStyle" | "historyLimit">,
  history: ChatMessage[]
): string {
  const recentHistory = history
    .slice(-settings.historyLimit)
    .map((message) => `${message.role === "user" ? "User" : "Pet"}: ${message.text}`)
    .join("\n");

  return `
あなたはPCのデスクトップに住む小さなAIキャラクター「${settings.characterName}」です。
性格と口調: ${settings.systemStyle}

ユーザーがしばらく操作していないので、邪魔にならない短い独り言を1つだけ言ってください。
質問攻めにせず、作業の邪魔をしない自然な一言にしてください。
会話履歴がある場合は、文脈に合う軽い一言にしてください。

必ず次のJSON形式だけで返してください。
Markdownや説明文は出力しないでください。

{
  "reply": "ユーザーに表示する短い独り言",
  "emotion": "idle | happy | thinking | confused | sleepy | concerned",
  "action": "none | wave | jump | sleep | nod"
}

会話履歴:
${recentHistory || "なし"}
`;
}
