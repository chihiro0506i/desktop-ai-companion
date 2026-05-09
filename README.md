# Local LLM Desktop Pet

Windows 11で動作する、Ollama連携のローカルLLMデスクトップペットです。透明なElectronウィンドウ上にかわいいキャラクターだけが浮いているように表示し、普通の秘書アシスタントとしてテキストで相談できます。

## 主な機能

- フレームなしElectronウィンドウ
- 透明ウィンドウ、常に最前面、タスクバー非表示
- キャラクターだけが浮くような透明UI
- 通常時はキャラクターだけを表示し、セリフは短時間だけ表示
- CSSベースのシンプルな白い丸キャラクター表示
- 待機中のまばたき、軽い上下動、ゆるい自律移動
- キャラクタークリックで会話フォームと設定ボタンを表示
- マウス位置への軽い視線追従とクリック反応
- 待機中の独り言生成とローカルフォールバック
- アプリ起動後の初回独り言は約30秒後、以降は設定した間隔で実行
- `/web 検索語` による明示的なWeb検索連携
- SearXNGエンドポイントを使った検索結果のプロンプト注入
- 設定画面による感情別キャラクター画像の変更
- 設定画面からの画像ファイル選択と感情別画像フォルダ読み込み
- 吹き出しとテキスト入力
- Ollama local HTTP API連携
- デフォルトモデル `qwen3.5:9b`
- `qwen3.5` 向けの `think: false` 指定
- Ollamaを標準にしつつ、OpenAI互換の外部APIにも切り替え可能
- 会話履歴の保存と、履歴を踏まえた応答
- 本格的な設定画面
  - キャラクター名
  - キャラクター画像
  - 性格と口調
  - AI Provider
  - Ollama API URL
  - 外部API URL / API Key / モデル名
  - モデル名
  - 会話文脈に使う履歴数
  - 独り言のON/OFFと間隔
  - Web検索のON/OFF、検索Endpoint、最大件数、Timeout
  - ペットサイズ
  - 常に最前面
  - 透明ウィンドウ
- JSON応答のパースとフォールバック
- Ollama未起動やモデル未取得時のエラー表示

## 画像設定

画像変更は会話入力欄ではなく、設定画面の `Images` タブから行います。OSのファイル選択ダイアログで各感情の画像を選択できます。

全感情に同じ画像を指定する場合は `全感情に画像を選択` を使います。

感情別の画像をまとめて読み込む場合は `フォルダから読込` を使います。選択したフォルダ内に、ファイル名へ感情キーを含む画像を置いてください。

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

内部的にはアプリ専用の `pet-image://` URLへ変換して保存します。画像はユーザーが利用権を持つものを指定してください。フォルダ選択では、選択したフォルダ内の画像ファイル名から感情キーを自動判定します。

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

## Web検索

Web検索は初期状態ではOFFです。設定画面の `Search` タブで有効化し、SearXNGのEndpointを指定してください。SearXNGはDocker Composeで起動できます。

### 初回準備

初回だけ `.env` を作成します。公開リポジトリへは `.env` を含めず、`.env.example` だけを置きます。

```powershell
copy .env.example .env
```

`.env` の `SEARXNG_SECRET` は任意の長い文字列に変更してください。

### SearXNGの起動

```powershell
npm run services:up
```

起動状態の確認:

```powershell
docker compose ps
```

検索APIの確認:

```powershell
npm run services:test
```

```text
Endpoint: http://localhost:8080
```

`Search` タブの `接続テスト` で、指定したEndpointから検索結果を取得できるか確認できます。

ログを見る場合:

```powershell
npm run services:logs
```

### SearXNGの停止

SearXNGだけを止める場合:

```powershell
npm run services:down
```

Dockerコンテナが残っているか確認する場合:

```powershell
docker compose ps
```

`Web検索APIが利用できません。アプリを再起動してください。` と出る場合は、古いElectronプロセスが残っている可能性があります。現在の `npm run dev` は起動前に古い開発プロセスを止めます。手動で止める場合は次を実行してください。

```powershell
npm run dev:stop
npm run dev
```

`http://localhost:5173` を通常のブラウザで開いた場合、Electronのpreload APIが存在しないためWeb検索は使えません。必ず `npm run dev` で起動した小さいElectronウィンドウ側で操作してください。Searchタブに `Desktop API OK` と表示されていれば、Electron側のAPIは有効です。

会話入力欄で次のように送信すると、検索結果をOllamaのプロンプトへ渡して回答します。

```text
/web 今日の東京の天気
/web TypeScript 5.9 release notes
```

検索Endpointは `http://localhost:8080` / `http://127.0.0.1:8080` / `http://[::1]:8080` など，このPC上のSearXNGだけ許可します。検索結果のURLは自動で開きません。

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
ollama pull qwen3.5:9b
```

アプリの初期設定は次の通りです。

```text
Model: qwen3.5:9b
API URL: http://localhost:11434
```

設定画面の `Ollama` タブから、AI Provider、接続テスト、モデル一覧取得ができます。取得したモデルはドロップダウンから選択できます。

## 外部API

標準はOllamaです。必要な場合だけ、設定画面の `Ollama` タブで `AI Provider` を `External API` に切り替えます。

外部APIはOpenAI互換の次のエンドポイントを想定します。

```text
GET /models
POST /chat/completions
```

設定項目:

```text
External API URL: https://api.example.com/v1
External Model: 使用するモデル名
External API Key: Bearer tokenとして送信するキー
```

API KeyはGitやlocalStorageには保存しません。入力したキーは，アプリ起動中のElectron main process内だけで保持され，アプリを終了すると消えます。共有PCや公開デモ環境では入力しないでください。

## 開発環境の起動

初回:

```powershell
npm install
copy .env.example .env
```

Web検索を使う場合はSearXNGを起動します。

```powershell
npm run services:up
```

アプリ本体を起動します。

```powershell
npm run dev
```

`npm run dev` は、古い開発用Electron/Viteプロセスを止めてから起動します。手動で止めたい場合は次を使います。

```powershell
npm run dev:stop
```

### 開発環境の停止

アプリ本体を止める場合は、`npm run dev` を実行しているPowerShellで `Ctrl+C` を押します。ウィンドウだけ残る場合は次を実行してください。

```powershell
npm run dev:stop
```

SearXNGも止める場合:

```powershell
npm run services:down
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
- 画像変更は設定画面の `Images` タブからのみ行います。会話入力欄に画像変更コマンドはありません。

## ライセンス

コードはMIT Licenseです。画像素材はリポジトリに含めず、各ユーザーが利用権を持つものを設定する前提です。

## 今後の拡張予定

- タスクトレイ常駐
- ウィンドウ位置保存
- モデル一覧の自動取得
- キャラクタープリセット
- PNG素材セット
- インストーラの動作確認
