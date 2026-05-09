type SpeechBubbleProps = {
  text: string;
};

export function SpeechBubble({ text }: SpeechBubbleProps) {
  return (
    <div className="speech-bubble" role="status" aria-live="polite">
      <div className="speech-bubble__content">{text}</div>
    </div>
  );
}
