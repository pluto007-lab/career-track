# Career Track

応募候補企業を同じ評価基準で比較し、応募状況や面接予定を一元管理する
個人向けWebアプリです。

現在はフェーズ1として、アプリの基盤のみを実装しています。

## 技術構成

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- LocalStorage
- Lucide React

## セットアップ

Node.js 20以降を推奨します。

```bash
pnpm install
pnpm dev
```

`npm install` / `npm run dev` でも実行できます。表示されたローカルURLを
ブラウザで開いてください。

## コマンド

```bash
pnpm dev
pnpm lint
pnpm build
pnpm preview
```

## 現在のルート

| URL | 画面 |
| --- | --- |
| `/` | ダッシュボード |
| `/companies` | 企業一覧 |
| `/companies/new` | 企業追加 |
| その他 | 404ページ |

## データ保存

LocalStorageでは以下のキーを使用します。

- `career-track-companies`
- `career-track-settings`

`src/lib/storage.ts` に読み書きの基本処理、`src/hooks/useLocalStorage.ts`
にReact stateと同期するための汎用フックを定義しています。

## フェーズ1の範囲

- 共通レイアウトとレスポンシブナビゲーション
- ルーティングとエラーページ
- ドメイン型定義
- LocalStorageの基本処理
- 各画面の空状態

企業登録フォーム、評価計算、検索、面接管理などは以降のフェーズで
実装します。
