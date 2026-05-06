# Local LLM Desktop Pet

Windows 11上で動作する、Ollama連携のローカルLLMデスクトップペットです。小さなElectronウィンドウにペットを表示し、テキストで話しかけるとOllamaのローカルAPIから返答を取得して吹き出しに表示します。

## 主な機能

- フレームなしElectronウィンドウ
- 透明ウィンドウと常に最前面の切り替え
- ペット状態表示: idle / thinking / talking / happy / confused / sleeping / concerned
- テキスト入力によるOllama連携
- JSON応答のパースとフォールバック
- Ollama未起動やモデル未取得時のエラー表示
- localStorageによる簡易設定保存

## 技術スタック

- Electron
- React
- TypeScript
- Vite
- Zustand
- Ollama local HTTP API
- electron-builder

## 必要な環境

- Windows 11
- Node.js 20以上推奨
- npm
- Ollama

## Ollamaの準備

Ollamaを起動し、設定画面に指定したモデルを取得してください。初期設定のモデル名は `qwen3.5:2b` です。

```bash
ollama serve
ollama pull qwen3.5:2b
```

別のモデルを使う場合は、アプリ内の設定で `Model` を変更します。

## 開発環境の起動

```bash
npm install
npm run dev
```

`npm run dev` はVite dev serverを起動し、Electronアプリを開きます。

## ビルド

```bash
npm run typecheck
npm run lint
npm run build
```

配布用パッケージを作る場合は次を実行します。

```bash
npm run dist
```

## 現在の制限

- 音声入力と音声出力は未実装です。
- Live2Dは未実装です。
- 画面監視、ファイル操作、OSコマンド実行は実装していません。
- ペット画像は未使用で、CSSベースのプレースホルダー表示です。
- 透明ウィンドウ設定は実行中に完全な再作成までは行わず、主に開発用表示モードの切り替えとして扱っています。

## 今後の拡張予定

- 設定画面の本格化
- PNG素材の追加
- 会話履歴保存の強化
- sleep復帰やアクション表現の改善
- electron-builder設定の詳細化
