![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)

# Career Track

> 就職活動を効率化するために開発した、企業・応募・面接を一元管理できるWebアプリ

![Career Track](img/preview.png)

🌐 **Demo**  
<https://pluto007-lab.github.io/career-track/>

📦 **Repository**  
<https://github.com/pluto007-lab/career-track>

---

## Overview

就職活動では、応募企業、面接予定、提出期限、企業情報などが複数のサービスに分散し、管理が煩雑になりがちです。

実際に自分自身が30社以上へ応募する中で、

- 次に何をするべきか分かりづらい
- 面接予定を見落としそうになる
- 企業比較がしにくい
- 不採用企業が一覧に残り、確認したい企業が埋もれる

といった課題を感じました。

Career Trackは、それらを一つのアプリで管理し、「今確認すべき企業」と「次にやるべきこと」が分かるようにすることを目的として制作しました。

実際の就職活動で日々利用しながら改善を続けている、実践型の個人開発プロジェクトです。

---

## Screenshots

### Dashboard

![Dashboard](img/dashboard.png)

### Company List

![Company List](img/company-list.png)

### Company Detail

![Company Detail](img/company-detail.png)

---

## Features

### 📁 企業管理

- 企業情報の登録・編集・削除
- 重複登録チェック
- アーカイブ機能
- 企業詳細画面

### 📝 応募管理

- 応募状況管理
- 提出期限
- 次回予定
- メモ

### 📊 企業評価

- ルールベースによる企業評価
- 評価理由の表示
- 手動調整
- 総評の記録
- 面接で確認したいことの管理
- 良い点・気になる点・自由メモを評価の参考情報として管理

### 🔍 一覧機能

- リアルタイム検索
- 応募媒体フィルター
- 状況フィルター
- 選考状況タブ
  - すべて
  - 選考中
  - 結果待ち
  - 面接予定
  - 内定
  - 不採用
  - アーカイブ
- 登録日・応募日・更新日など複数の並べ替え
- 終了した選考（辞退・不採用）の折りたたみ表示

### 💾 データ管理

- JSONバックアップ
- JSONインポート
- インポート前の自動バックアップ
- 不正データ検証
- 既存データとの後方互換

### 📱 Responsive

PC・タブレット・スマートフォン対応

---

## Development Story

本アプリは、実際の就職活動で利用しながら継続的に改善を重ねています。

当初は企業情報を登録するシンプルなアプリでしたが、運用を続ける中で課題が見つかるたびに機能を追加しました。

例えば、

- 登録企業が増えたため検索機能を追加
- 面接予定だけを確認したくなりタブ機能を追加
- 新しく登録した企業を見つけやすくするため登録日順を追加
- 不採用企業を埋もれさせないためアーカイブ機能を追加

など、実際の利用体験をもとに改善を続けています。

開発を続ける中で、LocalStorageのみでは開発環境の変更時にデータを引き継げないという課題も見つかりました。
そのためJSONバックアップ・復元機能を追加し、異なる環境でもデータを安全に移行できるよう改善しています。

---

## Technical Highlights

- `applicationStatus`を中心に、一覧・検索・絞り込み・タブ表示を共通ロジックで管理
- タイムゾーンの違いによる日付ずれを防ぐJST基準の日付処理
- 企業評価はルールベースで算出し、評価理由を表示する説明可能な設計
- LocalStorageの既存データを壊さない後方互換設計
- JSONバックアップ・復元機能
- インポート前のデータ検証
- 書き込み失敗時のロールバック
- 将来のSupabase移行を見据えた設計

---

## AI Usage

生成AIは以下の用途で活用しました。

- 要件整理
- UI設計
- コード実装支援
- リファクタリング
- 不具合調査
- レビュー

生成結果をそのまま採用するのではなく、仕様との整合性を確認しながら採用しています。

企業評価そのものは生成AIではなく、アプリ内で定義したルールに基づいて算出しています。

---

## Completed

- [x] 企業詳細画面
- [x] 総評
- [x] JSONバックアップ・復元
- [x] データ管理画面

---

## Roadmap

### Phase 1：認証・クラウド対応

- [ ] Supabaseの導入
- [ ] Googleログイン
- [ ] クラウド保存
- [ ] LocalStorageからSupabaseへのデータ移行
- [ ] 複数端末間でのデータ同期

### Phase 2：Googleカレンダー連携

- [ ] 面接・面談予定をGoogleカレンダーへ追加
- [ ] 面接予定の同期
- [ ] 面接・提出期限のリマインダー

### Phase 3：Gmail連携

- [ ] 面接案内メールの取得
- [ ] メール本文から日時・企業名・面接形式を抽出
- [ ] ワンクリックで応募情報を更新

### Phase 4：UI・UX改善

- [ ] アプリ全体のデザインをリニューアル
- [ ] 配色・余白・タイポグラフィの見直し
- [ ] タブやメニューへのアイコン追加
- [ ] 情報設計の改善
- [ ] アクセシビリティの向上

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

### Storage

- LocalStorage
- JSONバックアップ / リストア

### Development

- Git
- GitHub
- ESLint
- pnpm
- Visual Studio Code

### AI

- ChatGPT
- Codex

---

## Setup

```bash
git clone https://github.com/pluto007-lab/career-track.git

cd career-track

pnpm install

pnpm dev
```

---

## Future

Career Trackは、現在も実際の就職活動で利用しながら継続的に改善しています。

今後はクラウド同期やGoogleサービスとの連携など、
より実用的な機能を追加していく予定です。

---

## License

This project is released under the MIT License.
