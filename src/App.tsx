import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { ChatInput } from "./components/ChatInput";
import { Pet } from "./components/Pet";
import { SettingsPanel } from "./components/SettingsPanel";
import { SpeechBubble } from "./components/SpeechBubble";
import { getCharacterImage } from "./lib/characterImages";
import { askSelfTalkOllama } from "./lib/ollamaClient";
import { usePetStore } from "./state/petStore";

type AutonomousPose = {
  x: number;
  y: number;
  rotate: number;
};

type InteractivePose = {
  lookX: number;
  lookY: number;
  tilt: number;
  pressed: boolean;
};

const idlePose: AutonomousPose = {
  x: 0,
  y: 0,
  rotate: 0
};

const idleInteraction: InteractivePose = {
  lookX: 0,
  lookY: 0,
  tilt: 0,
  pressed: false
};

function createAutonomousPose(): AutonomousPose {
  return {
    x: Math.round(Math.random() * 12 - 6),
    y: Math.round(Math.random() * 6 - 4),
    rotate: Number((Math.random() * 2.4 - 1.2).toFixed(1))
  };
}

const fallbackSelfTalk = [
  "少しだけ、そばにいます。",
  "作業、静かに見守っています。",
  "ひと息ついても大丈夫です。",
  "ここで待っています。",
  "無理せずいきましょう。"
];

function chooseFallbackSelfTalk(): string {
  return fallbackSelfTalk[Math.floor(Math.random() * fallbackSelfTalk.length)] ?? fallbackSelfTalk[0];
}

export default function App() {
  const bubbleText = usePetStore((state) => state.bubbleText);
  const addMessage = usePetStore((state) => state.addMessage);
  const action = usePetStore((state) => state.action);
  const emotion = usePetStore((state) => state.emotion);
  const isSettingsOpen = usePetStore((state) => state.isSettingsOpen);
  const isLoading = usePetStore((state) => state.isLoading);
  const messages = usePetStore((state) => state.messages);
  const settings = usePetStore((state) => state.settings);
  const setBubbleText = usePetStore((state) => state.setBubbleText);
  const setEmotion = usePetStore((state) => state.setEmotion);
  const setSettingsOpen = usePetStore((state) => state.setSettingsOpen);
  const [autonomousPose, setAutonomousPose] = useState<AutonomousPose>(idlePose);
  const [interaction, setInteraction] = useState<InteractivePose>(idleInteraction);
  const [controlsOpen, setControlsOpen] = useState(false);
  const selfTalkBusyRef = useRef(false);

  useEffect(() => {
    window.desktopPet?.setWindowMode({
      alwaysOnTop: settings.alwaysOnTop,
      transparent: settings.transparentWindow
    });
  }, [settings.alwaysOnTop, settings.transparentWindow]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const timer = window.setTimeout(() => {
      setEmotion("sleepy", "sleep");
    }, 1000 * 60 * 5);

    return () => window.clearTimeout(timer);
  }, [emotion, isLoading, setEmotion]);

  useEffect(() => {
    if (isLoading || isSettingsOpen) {
      setAutonomousPose(idlePose);
      return;
    }

    const timer = window.setInterval(() => {
      setAutonomousPose(createAutonomousPose());
    }, 4500);

    return () => window.clearInterval(timer);
  }, [isLoading, isSettingsOpen]);

  useEffect(() => {
    if (!settings.selfTalkEnabled || isLoading || selfTalkBusyRef.current || isSettingsOpen || controlsOpen) {
      return;
    }

    const delay = Math.max(1, settings.selfTalkIntervalMinutes) * 60 * 1000;
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      selfTalkBusyRef.current = true;

      try {
        const result = await askSelfTalkOllama(settings, messages);

        if (cancelled) {
          return;
        }

        addMessage({ role: "pet", text: result.reply });
        setBubbleText(result.reply);
        setEmotion(result.emotion, result.action);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.warn("Self-talk fell back to local phrase", error);
        const reply = chooseFallbackSelfTalk();
        addMessage({ role: "pet", text: reply });
        setBubbleText(reply);
        setEmotion("idle", "none");
      } finally {
        selfTalkBusyRef.current = false;
      }
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    addMessage,
    controlsOpen,
    isLoading,
    isSettingsOpen,
    messages,
    setBubbleText,
    setEmotion,
    settings
  ]);

  function toggleControls() {
    setControlsOpen((open) => !open);
  }

  function handlePetPointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normalizedX = Math.max(-1, Math.min(1, (event.clientX - centerX) / (rect.width / 2)));
    const normalizedY = Math.max(-1, Math.min(1, (event.clientY - centerY) / (rect.height / 2)));

    setInteraction((current) => ({
      ...current,
      lookX: Number((normalizedX * 4).toFixed(1)),
      lookY: Number((normalizedY * 3).toFixed(1)),
      tilt: Number((normalizedX * 2).toFixed(1))
    }));
  }

  function handlePetPointerLeave() {
    setInteraction(idleInteraction);
  }

  function handlePetKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    toggleControls();
  }

  return (
    <main className={settings.transparentWindow ? "app app--transparent" : "app app--debug"}>
      <section className="pet-stage" style={{ ["--pet-size" as string]: `${settings.petSize}px` }}>
        <SpeechBubble text={bubbleText} />

        <div
          className={`pet-button pet-button--autonomous ${interaction.pressed ? "is-pressed" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={settings.characterName}
          aria-expanded={controlsOpen}
          onClick={toggleControls}
          onKeyDown={handlePetKeyDown}
          onPointerMove={handlePetPointerMove}
          onPointerLeave={handlePetPointerLeave}
          onPointerDown={() => setInteraction((current) => ({ ...current, pressed: true }))}
          onPointerUp={() => setInteraction((current) => ({ ...current, pressed: false }))}
          style={
            {
              "--pet-wander-x": `${autonomousPose.x}px`,
              "--pet-wander-y": `${autonomousPose.y}px`,
              "--pet-wander-rotate": `${autonomousPose.rotate}deg`,
              "--pet-look-x": `${interaction.lookX}px`,
              "--pet-look-y": `${interaction.lookY}px`,
              "--pet-look-rotate": `${interaction.tilt}deg`
            } as CSSProperties
          }
        >
          <Pet
            emotion={emotion}
            action={action}
            imageSrc={getCharacterImage(settings.characterImages, emotion)}
            name={settings.characterName}
            size={settings.petSize}
          />
        </div>

        {controlsOpen && (
          <div className="chat-row">
            <ChatInput />
            <button className="settings-fab" type="button" onClick={() => setSettingsOpen(true)} aria-label="設定を開く">
              ⚙
            </button>
          </div>
        )}

        <SettingsPanel open={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
      </section>
    </main>
  );
}
