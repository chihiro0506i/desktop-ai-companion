import { useEffect } from "react";
import { ChatInput } from "./components/ChatInput";
import { Pet } from "./components/Pet";
import { SettingsPanel } from "./components/SettingsPanel";
import { SpeechBubble } from "./components/SpeechBubble";
import { usePetStore } from "./state/petStore";

export default function App() {
  const bubbleText = usePetStore((state) => state.bubbleText);
  const action = usePetStore((state) => state.action);
  const emotion = usePetStore((state) => state.emotion);
  const isChatOpen = usePetStore((state) => state.isChatOpen);
  const isLoading = usePetStore((state) => state.isLoading);
  const settings = usePetStore((state) => state.settings);
  const setEmotion = usePetStore((state) => state.setEmotion);
  const setChatOpen = usePetStore((state) => state.setChatOpen);

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
        {isChatOpen && <SpeechBubble text={bubbleText} />}
        <button className="pet-button" type="button" onClick={() => setChatOpen(!isChatOpen)}>
          <Pet emotion={emotion} action={action} size={settings.petSize} />
        </button>
        {isChatOpen && (
          <div className="panel-stack">
            <ChatInput />
            <SettingsPanel />
          </div>
        )}
      </section>
    </main>
  );
}
