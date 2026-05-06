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

const firstSelfTalkDelayMs = 30 * 1000;
const selfTalkPollMs = 5 * 1000;
const bubbleVisibleMs = 8 * 1000;

function chooseFallbackSelfTalk(): string {
  return fallbackSelfTalk[Math.floor(Math.random() * fallbackSelfTalk.length)] ?? fallbackSelfTalk[0];
}

function getSelfTalkDelayMs(intervalMinutes: number): number {
  return Math.max(1, intervalMinutes) * 60 * 1000;
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
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const selfTalkBusyRef = useRef(false);
  const hasSelfTalkRunRef = useRef(false);
  const latestMessagesRef = useRef(messages);
  const latestSettingsRef = useRef(settings);
  const nextSelfTalkAtRef = useRef(Date.now() + firstSelfTalkDelayMs);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (controlsOpen || isSettingsOpen) {
      setBubbleVisible(true);
      return;
    }

    if (!bubbleVisible) {
      return;
    }

    const timer = window.setTimeout(() => {
      setBubbleVisible(false);
    }, bubbleVisibleMs);

    return () => window.clearTimeout(timer);
  }, [bubbleText, bubbleVisible, controlsOpen, isSettingsOpen]);

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
    function markActivity() {
      const delay = hasSelfTalkRunRef.current
        ? getSelfTalkDelayMs(latestSettingsRef.current.selfTalkIntervalMinutes)
        : firstSelfTalkDelayMs;
      nextSelfTalkAtRef.current = Date.now() + delay;
    }

    window.addEventListener("pointerdown", markActivity);
    window.addEventListener("keydown", markActivity);

    return () => {
      window.removeEventListener("pointerdown", markActivity);
      window.removeEventListener("keydown", markActivity);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function runSelfTalk() {
      if (
        cancelled ||
        !latestSettingsRef.current.selfTalkEnabled ||
        isLoading ||
        isSettingsOpen ||
        selfTalkBusyRef.current ||
        Date.now() < nextSelfTalkAtRef.current
      ) {
        return;
      }

      selfTalkBusyRef.current = true;
      nextSelfTalkAtRef.current = Date.now() + getSelfTalkDelayMs(latestSettingsRef.current.selfTalkIntervalMinutes);

      try {
        const result = await askSelfTalkOllama(latestSettingsRef.current, latestMessagesRef.current);

        if (cancelled) {
          return;
        }

        addMessage({ role: "pet", text: result.reply });
        hasSelfTalkRunRef.current = true;
        setBubbleText(result.reply);
        setBubbleVisible(true);
        setEmotion(result.emotion, result.action);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.warn("Self-talk fell back to local phrase", error);
        const reply = chooseFallbackSelfTalk();
        addMessage({ role: "pet", text: reply });
        hasSelfTalkRunRef.current = true;
        setBubbleText(reply);
        setBubbleVisible(true);
        setEmotion("idle", "none");
      } finally {
        selfTalkBusyRef.current = false;
      }
    }

    const timer = window.setInterval(() => {
      void runSelfTalk();
    }, selfTalkPollMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [addMessage, isLoading, isSettingsOpen, setBubbleText, setEmotion]);

  function toggleControls() {
    setControlsOpen((open) => !open);
    setBubbleVisible(true);
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
        {bubbleVisible && <SpeechBubble text={bubbleText} />}

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
            <ChatInput onBubbleRequest={() => setBubbleVisible(true)} />
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
