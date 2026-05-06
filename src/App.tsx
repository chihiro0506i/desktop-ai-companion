import { useEffect } from "react";
import { ChatInput } from "./components/ChatInput";
import { Pet } from "./components/Pet";
import { SettingsPanel } from "./components/SettingsPanel";
import { SpeechBubble } from "./components/SpeechBubble";
import { getCharacterImage } from "./lib/characterImages";
import { usePetStore } from "./state/petStore";

export default function App() {
  const bubbleText = usePetStore((state) => state.bubbleText);
  const action = usePetStore((state) => state.action);
  const emotion = usePetStore((state) => state.emotion);
  const isSettingsOpen = usePetStore((state) => state.isSettingsOpen);
  const isLoading = usePetStore((state) => state.isLoading);
  const settings = usePetStore((state) => state.settings);
  const setEmotion = usePetStore((state) => state.setEmotion);
  const setSettingsOpen = usePetStore((state) => state.setSettingsOpen);

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

  return (
    <main className={settings.transparentWindow ? "app app--transparent" : "app app--debug"}>
      <section className="pet-stage" style={{ ["--pet-size" as string]: `${settings.petSize}px` }}>
        <SpeechBubble text={bubbleText} />

        <div className="pet-button" aria-label={settings.characterName}>
          <Pet
            emotion={emotion}
            action={action}
            imageSrc={getCharacterImage(settings.characterImages, emotion)}
            name={settings.characterName}
            size={settings.petSize}
          />
        </div>

        <div className="chat-row">
          <ChatInput />
          <button className="settings-fab" type="button" onClick={() => setSettingsOpen(true)} aria-label="設定を開く">
            ⚙
          </button>
        </div>

        <SettingsPanel open={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
      </section>
    </main>
  );
}
