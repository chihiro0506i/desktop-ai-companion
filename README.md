# Local LLM Desktop Pet

Windows 11で動作する、Ollama連携のローカルLLMデスクトップペットです。透明なElectronウィンドウ上にキャラクターだけが浮いているように表示し、テキストで会話できます。

## 主な機能

- フレームなしElectronウィンドウ
- 透明ウィンドウ、常に最前面、タスクバー非表示
- キャラクターだけが浮くような透明UI
- CSSベースの仮キャラクター表示
- `/image` コマンドまたは設定画面による感情別キャラクター画像の変更
- 吹き出しとテキスト入力
- Ollama local HTTP API連携
- デフォルトモデル `qwen3.5:2b`
- `qwen3.5:2b` 向けの `think: false` 指定
- 会話履歴の保存と、履歴を踏まえた応答
- 本格的な設定画面
  - キャラクター名
  - キャラクター画像
  - 性格と口調
  - Ollama API URL
  - モデル名
  - 会話文脈に使う履歴数
  - ペットサイズ
  - 常に最前面
  - 透明ウィンドウ
- JSON応答のパースとフォールバック
- Ollama未起動やモデル未取得時のエラー表示

## `/image` コマンド

会話入力欄で次の形式を送信すると、感情別のキャラクター画像を変更できます。

```text
/image idle https://example.com/idle.png
/image happy https://example.com/happy.png
/image confused https://example.com/confused.png
```

全感情に同じ画像を一括指定する場合は `all` を使います。従来通り `/image 画像URL` と書いた場合も `all` と同じ扱いです。

```text
/image all https://example.com/character.png
```

Windows上のローカル画像も指定できます。

```text
/image sleepy C:\Users\chihi\Pictures\sleepy.png
```

アプリ配下のフォルダ内に、ファイル名へ感情キーを含む画像を置いた場合は、まとめて読み込めます。

```text
/image folder private-images
```

例:

```text
private-images/
  pet_idle.png
  pet_thinking.png
  talking.png
  pet_happy.png
  pet_confused.png
  pet_sleepy.png
  pet_concerned.png
```

内部的にはアプリ専用の `pet-image://` URLへ変換して保存します。画像はユーザーが利用権を持つものを指定してください。

現在の感情キーは次の7種類です。

```text
idle
thinking
talking
happy
confused
sleepy
concerned
```

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

WSL Ubuntu上のOllamaでも、Windows PowerShellから次が通ればアプリから利用できます。

```powershell
curl.exe http://localhost:11434/api/tags
```

モデルを用意します。

```bash
ollama pull qwen3.5:2b
```

アプリの初期設定は次の通りです。

```text
Model: qwen3.5:2b
API URL: http://localhost:11434
```

## 開発環境の起動

```bash
npm install
npm run dev
```

## 品質確認

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

- Live2Dは未実装です。
- 音声入力と音声出力は未実装です。
- 画面監視、ファイル操作、OSコマンド自動実行は実装していません。
- 透明ウィンドウ設定の完全な切り替えには、将来的にBrowserWindow再作成処理を入れる余地があります。
- 画像素材はこのリポジトリに含めません。ユーザーが自分で利用権を持つ画像を指定してください。
- `/image folder` は安全のためアプリ配下の相対フォルダだけを対象にします。任意の場所にある画像は `/image idle C:\path\idle.png` のように個別指定してください。

## ライセンス

コードはMIT Licenseです。画像素材はリポジトリに含めず、各ユーザーが利用権を持つものを設定する前提です。

## 今後の拡張予定

- タスクトレイ常駐
- ウィンドウ位置保存
- モデル一覧の自動取得
- キャラクタープリセット
- PNG素材セット
- インストーラの動作確認
