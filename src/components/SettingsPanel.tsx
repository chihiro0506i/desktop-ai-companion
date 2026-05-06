import { usePetStore } from "../state/petStore";

export function SettingsPanel() {
  const settings = usePetStore((state) => state.settings);
  const setSettings = usePetStore((state) => state.setSettings);
  const resetSettings = usePetStore((state) => state.resetSettings);

  return (
    <details className="settings-panel">
      <summary>設定</summary>
      <label>
        <span>Model</span>
        <input
          value={settings.modelName}
          onChange={(event) => setSettings({ modelName: event.target.value })}
        />
      </label>
      <label>
        <span>API URL</span>
        <input
          value={settings.ollamaApiUrl}
          onChange={(event) => setSettings({ ollamaApiUrl: event.target.value })}
        />
      </label>
      <label>
        <span>Size</span>
        <input
          type="range"
          min="110"
          max="240"
          value={settings.petSize}
          onChange={(event) => setSettings({ petSize: Number(event.target.value) })}
        />
      </label>
      <label className="settings-panel__check">
        <input
          type="checkbox"
          checked={settings.alwaysOnTop}
          onChange={(event) => setSettings({ alwaysOnTop: event.target.checked })}
        />
        <span>常に最前面</span>
      </label>
      <label className="settings-panel__check">
        <input
          type="checkbox"
          checked={settings.transparentWindow}
          onChange={(event) => setSettings({ transparentWindow: event.target.checked })}
        />
        <span>透明ウィンドウ</span>
      </label>
      <button type="button" className="settings-panel__reset" onClick={resetSettings}>
        初期化
      </button>
    </details>
  );
}
