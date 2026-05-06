import { FormEvent, useState } from "react";
import { askOllama, OllamaError } from "../lib/ollamaClient";
import {
  extractWebSearchQuery,
  formatSearchReferences,
  searchWeb,
  shouldAutoSearch,
  WebSearchError
} from "../lib/webSearch";
import { usePetStore } from "../state/petStore";

type ChatInputProps = {
  onBubbleRequest?: () => void;
};

function formatBubbleReply(reply: string, sourceCount: number): string {
  if (sourceCount === 0) {
    return reply;
  }

  const references = Array.from({ length: sourceCount }, (_, index) => `[${index + 1}]`).join(" ");
  return `${reply}\n参照: ${references}`;
}

export function ChatInput({ onBubbleRequest }: ChatInputProps) {
  const [input, setInput] = useState("");
  const addMessage = usePetStore((state) => state.addMessage);
  const messages = usePetStore((state) => state.messages);
  const setBubbleText = usePetStore((state) => state.setBubbleText);
  const setEmotion = usePetStore((state) => state.setEmotion);
  const setLoading = usePetStore((state) => state.setLoading);
  const isLoading = usePetStore((state) => state.isLoading);
  const settings = usePetStore((state) => state.settings);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();

    if (!message || isLoading) {
      return;
    }

    setInput("");

    const explicitSearchQuery = extractWebSearchQuery(message);
    const shouldSearch =
      explicitSearchQuery !== null ||
      (settings.webSearch.enabled && settings.webSearch.autoSearch && shouldAutoSearch(message));
    const effectiveMessage = explicitSearchQuery ?? message;
    const userMessage = addMessage({ role: "user", text: message });
    setBubbleText(shouldSearch ? "Web検索しています..." : "考えています...");
    onBubbleRequest?.();
    setEmotion("thinking", "nod");
    setLoading(true);

    try {
      const searchResults = shouldSearch ? await searchWeb(effectiveMessage, settings.webSearch) : undefined;
      const result = await askOllama(effectiveMessage, settings, [...messages, userMessage], searchResults);
      const reply = searchResults && searchResults.length > 0
        ? `${result.reply}\n\n参照:\n${formatSearchReferences(searchResults)}`
        : result.reply;
      const bubbleReply = searchResults ? formatBubbleReply(result.reply, searchResults.length) : result.reply;

      addMessage({ role: "pet", text: reply, sources: searchResults });
      setBubbleText(bubbleReply);
      onBubbleRequest?.();
      setEmotion(result.emotion, result.action);
    } catch (error) {
      if (error instanceof WebSearchError && explicitSearchQuery !== null) {
        console.error("Explicit web search failed", error);
        addMessage({ role: "pet", text: error.message });
        setBubbleText(error.message);
        onBubbleRequest?.();
        setEmotion("confused", "none");
        return;
      }

      if (error instanceof WebSearchError) {
        console.warn("Auto web search failed; falling back to normal chat", error);

        try {
          const result = await askOllama(effectiveMessage, settings, [...messages, userMessage]);
          addMessage({ role: "pet", text: result.reply });
          setBubbleText(result.reply);
          onBubbleRequest?.();
          setEmotion(result.emotion, result.action);
          return;
        } catch (fallbackError) {
          console.error("Fallback chat request failed", fallbackError);
        }
      }

      const fallback = error instanceof OllamaError
        ? error.message
        : "返答中に問題が起きました。Ollamaの状態を確認してください。";

      console.error("Chat request failed", error);
      addMessage({ role: "pet", text: fallback });
      setBubbleText(fallback);
      onBubbleRequest?.();
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
        placeholder="話しかける..."
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
