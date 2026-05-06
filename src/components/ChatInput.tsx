import { FormEvent, useState } from "react";
import { askOllama, OllamaError } from "../lib/ollamaClient";
import { usePetStore } from "../state/petStore";

type ChatInputProps = {
  onBubbleRequest?: () => void;
};

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

    const userMessage = addMessage({ role: "user", text: message });
    setBubbleText("考えています...");
    onBubbleRequest?.();
    setEmotion("thinking", "nod");
    setLoading(true);

    try {
      const result = await askOllama(message, settings, [...messages, userMessage]);
      addMessage({ role: "pet", text: result.reply });
      setBubbleText(result.reply);
      onBubbleRequest?.();
      setEmotion(result.emotion, result.action);
    } catch (error) {
      const fallback =
        error instanceof OllamaError
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
