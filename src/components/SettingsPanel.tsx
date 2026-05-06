import { useMemo, useState } from "react";
import {
  createEmptyCharacterImages,
  normalizeImageSource,
  petEmotionLabels,
  petEmotions
} from "../lib/characterImages";
import { listOllamaModels, OllamaError } from "../lib/ollamaClient";
import { usePetStore } from "../state/petStore";
import type { PetEmotion } from "../types/pet";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
};

type SettingsTab = "character" | "images" | "ollama" | "window" | "history";

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("character");
  const [imageStatus, setImageStatus] = useState("");
  const [ollamaStatus, setOllamaStatus] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const messages = usePetStore((state) => state.messages);
  const settings = usePetStore((state) => state.settings);
  const setSettings = usePetStore((state) => state.setSettings);
  const resetSettings = usePetStore((state) => state.resetSettings);
  const clearMessages = usePetStore((state) => state.clearMessages);

  const userMessageCount = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages]
  );

  function setEmotionImage(emotion: PetEmotion, value: string) {
    setSettings({
      characterImages: {
        ...settings.characterImages,
        [emotion]: value
      }
    });
  }

  function normalizeEmotionImage(emotion: PetEmotion, value: string) {
    setSettings({
      characterImages: {
        ...settings.characterImages,
        [emotion]: normalizeImageSource(value)
      }
    });
  }

  function setAllImages(value: string) {
    setSettings({
      characterImages: createEmptyCharacterImages(normalizeImageSource(value))
    });
  }

  async function selectEmotionImage(emotion: PetEmotion) {
    const imageSrc = await window.desktopPet?.selectImageFile();

    if (!imageSrc) {
      return;
    }

    setEmotionImage(emotion, imageSrc);
    setImageStatus(`${petEmotionLabels[emotion]} の画像を選択しました。`);
  }

  async function selectAllImage() {
    const imageSrc = await window.desktopPet?.selectImageFile();

    if (!imageSrc) {
      return;
    }

    setSettings({
      characterImages: createEmptyCharacterImages(imageSrc)
    });
    setImageStatus("すべての感情に同じ画像を設定しました。");
  }

  async function selectEmotionImageFolder() {
    const images = await window.desktopPet?.selectImageFolder();

    if (!images) {
      return;
    }

    const foundEmotions = petEmotions.filter((emotion) => images[emotion]);
    const missingEmotions = petEmotions.filter((emotion) => !images[emotion]);

    setSettings({
      characterImages: {
        ...settings.characterImages,
        ...images
      }
    });
    setImageStatus(
      missingEmotions.length > 0
        ? `画像を${foundEmotions.length}件読み込みました。不足: ${missingEmotions.join(", ")}`
        : "すべての感情画像を読み込みました。"
    );
  }

  async function refreshOllamaModels() {
    setOllamaStatus("接続確認中...");

    try {
      const models = await listOllamaModels(settings);
      setAvailableModels(models);
      setOllamaStatus(
        models.length > 0
          ? `接続OK。${models.length}件のモデルを取得しました。`
          : "接続OK。モデルはまだ取得されていません。"
      );
    } catch (error) {
      const message =
        error instanceof OllamaError
          ? error.message
          : "Ollama接続確認中に問題が起きました。";
      setAvailableModels([]);
      setOllamaStatus(message);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <aside className="settings-drawer" aria-label="設定">
      <header className="settings-drawer__header">
        <div>
          <h2>設定</h2>
          <p>{settings.characterName} の振る舞いと接続を調整します。</p>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="設定を閉じる">
          x
        </button>
      </header>

      <nav className="settings-tabs" aria-label="設定カテゴリ">
        <button type="button" className={activeTab === "character" ? "is-active" : ""} onClick={() => setActiveTab("character")}>
          Character
        </button>
        <button type="button" className={activeTab === "images" ? "is-active" : ""} onClick={() => setActiveTab("images")}>
          Images
        </button>
        <button type="button" className={activeTab === "ollama" ? "is-active" : ""} onClick={() => setActiveTab("ollama")}>
          Ollama
        </button>
        <button type="button" className={activeTab === "window" ? "is-active" : ""} onClick={() => setActiveTab("window")}>
          Window
        </button>
        <button type="button" className={activeTab === "history" ? "is-active" : ""} onClick={() => setActiveTab("history")}>
          History
        </button>
      </nav>

      <div className="settings-content">
        {activeTab === "character" && (
          <section className="settings-section">
            <label>
              <span>名前</span>
              <input
                value={settings.characterName}
                onChange={(event) => setSettings({ characterName: event.target.value })}
              />
            </label>
            <label>
              <span>性格と口調</span>
              <textarea
                rows={4}
                value={settings.systemStyle}
                onChange={(event) => setSettings({ systemStyle: event.target.value })}
              />
            </label>
            <label>
              <span>サイズ {settings.petSize}px</span>
              <input
                type="range"
                min="110"
                max="300"
                value={settings.petSize}
                onChange={(event) => setSettings({ petSize: Number(event.target.value) })}
              />
            </label>
          </section>
        )}

        {activeTab === "images" && (
          <section className="settings-section">
            <div className="button-row">
              <button type="button" className="secondary-button" onClick={selectAllImage}>
                全感情に画像を選択
              </button>
              <button type="button" className="secondary-button" onClick={selectEmotionImageFolder}>
                フォルダから読込
              </button>
            </div>
            <label>
              <span>全感情に同じ画像</span>
              <input
                placeholder="画像URLまたはローカル画像パス"
                onBlur={(event) => {
                  if (event.target.value.trim()) {
                    setAllImages(event.target.value);
                    event.target.value = "";
                  }
                }}
              />
            </label>
            <div className="emotion-image-list">
              {petEmotions.map((emotion) => (
                <label key={emotion}>
                  <span>
                    {petEmotionLabels[emotion]} <small>{emotion}</small>
                  </span>
                  <input
                    value={settings.characterImages[emotion]}
                    placeholder={`${emotion} の画像`}
                    onChange={(event) => setEmotionImage(emotion, event.target.value)}
                    onBlur={(event) => normalizeEmotionImage(emotion, event.target.value)}
                  />
                  <button type="button" className="inline-button" onClick={() => selectEmotionImage(emotion)}>
                    選択
                  </button>
                </label>
              ))}
            </div>
            {imageStatus && <p className="settings-status">{imageStatus}</p>}
          </section>
        )}

        {activeTab === "ollama" && (
          <section className="settings-section">
            <label>
              <span>Model</span>
              <input
                value={settings.modelName}
                onChange={(event) => setSettings({ modelName: event.target.value })}
              />
            </label>
            {availableModels.length > 0 && (
              <label>
                <span>取得済みモデル</span>
                <select
                  value={settings.modelName}
                  onChange={(event) => setSettings({ modelName: event.target.value })}
                >
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              <span>API URL</span>
              <input
                value={settings.ollamaApiUrl}
                onChange={(event) => setSettings({ ollamaApiUrl: event.target.value })}
              />
            </label>
            <label>
              <span>会話文脈 {settings.historyLimit}件</span>
              <input
                type="range"
                min="4"
                max="30"
                value={settings.historyLimit}
                onChange={(event) => setSettings({ historyLimit: Number(event.target.value) })}
              />
            </label>
            <button type="button" className="secondary-button" onClick={refreshOllamaModels}>
              接続テスト / モデル取得
            </button>
            {ollamaStatus && <p className="settings-status">{ollamaStatus}</p>}
          </section>
        )}

        {activeTab === "window" && (
          <section className="settings-section">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={settings.alwaysOnTop}
                onChange={(event) => setSettings({ alwaysOnTop: event.target.checked })}
              />
              <span>常に最前面</span>
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={settings.transparentWindow}
                onChange={(event) => setSettings({ transparentWindow: event.target.checked })}
              />
              <span>透明ウィンドウ</span>
            </label>
            <button type="button" className="secondary-button" onClick={resetSettings}>
              設定を初期化
            </button>
          </section>
        )}

        {activeTab === "history" && (
          <section className="settings-section">
            <div className="history-summary">
              <strong>{messages.length}</strong>
              <span>保存済みメッセージ</span>
              <strong>{userMessageCount}</strong>
              <span>ユーザー発言</span>
            </div>
            <div className="history-list">
              {messages.slice(-24).map((message) => (
                <article key={message.id} className={`history-item history-item--${message.role}`}>
                  <span>{message.role === "user" ? "You" : settings.characterName}</span>
                  <p>{message.text}</p>
                </article>
              ))}
            </div>
            <button type="button" className="danger-button" onClick={clearMessages}>
              会話履歴を削除
            </button>
          </section>
        )}
      </div>
    </aside>
  );
}
