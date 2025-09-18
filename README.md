# YOAKE - コワーキングカフェ会員制サービス

YOAKE は、副業やキャリア成長を目指すビジネスパーソン向けのコワーキングカフェ会員制サービスです。LINE を中心としたデジタル体験を提供し、月額 980 円で利用できる仕組みです。

## 🚀 主な機能

### ユーザー機能

- **LINE 連携による会員登録**: LINE LIFF を使用したシームレスな登録体験
- **Stripe 決済システム**: 月額 980 円の安全な決済処理
- **QR コード店舗チェックイン**: 簡単な店舗利用開始
- **デジタル会員証**: 3D フリップカードによる魅力的な会員証表示
- **来店履歴・分析**: Chart.js を使用したデータ可視化
- **リッチメニューナビゲーション**: LINE 内での直感的な操作

### 管理機能

- **ユーザー管理**: 会員登録、アカウント連携
- **決済管理**: Stripe 統合による安全な決済処理
- **データ分析**: ユーザー行動分析とレポート生成
- **店舗管理**: 複数店舗の管理と QR コード生成

## 🏗️ 技術スタック

### フロントエンド

- **React 18** with TypeScript
- **React Router** - SPA routing
- **Chart.js & React-Chartjs-2** - データ可視化
- **Stripe Elements** - 決済 UI
- **LINE LIFF SDK** - LINE 統合
- **CSS3** - カスタムアニメーション（3D カード等）

### バックエンド

- **Node.js & Express** with TypeScript
- **Supabase** - PostgreSQL database
- **Stripe** - 決済処理
- **LINE Messaging API** - メッセージング
- **Helmet** - セキュリティ
- **Express Rate Limit** - API 保護

### インフラ・デプロイ

- **Render** - ホスティング
- **Supabase** - データベース
- **UptimeRobot** - 監視・ヘルスチェック
- **LINE Developers** - LINE API 管理

## 📦 プロジェクト構成

```
yoake/
├── client/                    # React フロントエンド
│   ├── src/
│   │   ├── components/       # 共通コンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── hooks/           # カスタムフック
│   │   ├── services/        # API サービス
│   │   ├── types/           # TypeScript 型定義
│   │   └── utils/           # ユーティリティ関数
│   ├── public/              # 静的ファイル
│   └── package.json
├── server/                   # Node.js バックエンド
│   ├── src/
│   │   ├── routes/          # API ルート
│   │   ├── services/        # ビジネスロジック
│   │   ├── middleware/      # Express ミドルウェア
│   │   ├── types/           # TypeScript 型定義
│   │   ├── utils/           # ユーティリティ関数
│   │   └── config/          # 設定管理
│   └── package.json
├── database/                # データベーススキーマ
│   └── schema.sql
└── README.md
```

## 🛠️ セットアップ手順

### 前提条件

- Node.js 18+
- npm または yarn
- LINE Developers アカウント
- Supabase プロジェクト
- Stripe アカウント

### 1. リポジトリクローン

```bash
git clone https://github.com/your-username/yoake.git
cd yoake
```

### 2. 依存関係インストール

```bash
# クライアント
cd client
npm install

# サーバー
cd ../server
npm install
```

### 3. 環境変数設定

#### サーバー側 (.env)

```bash
# LINE設定
LINE_LOGIN_CHANNEL_ID=your_line_login_channel_id
LINE_LOGIN_CHANNEL_SECRET=your_line_login_channel_secret
LINE_MESSAGING_API_TOKEN=your_line_messaging_api_token
LIFF_ID_LINKING=your_liff_id_linking

# データベース
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# 決済
STRIPE_SECRET_KEY=your_stripe_secret_key

# その他
PORT=3001
RICH_MENU_ID_MEMBER=your_rich_menu_id_member
```

#### クライアント側 (.env)

```bash
# LIFF設定
REACT_APP_LIFF_ID_REGISTER=your_liff_id_register
REACT_APP_LIFF_ID_LINKING=your_liff_id_linking
REACT_APP_LIFF_ID_CHECKIN=your_liff_id_checkin
REACT_APP_LIFF_ID_CARD=your_liff_id_card
REACT_APP_LIFF_ID_HISTORY=your_liff_id_history

# 決済
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 4. データベースセットアップ

```bash
# Supabase SQL エディタで実行
psql -f database/schema.sql
```

### 5. 開発サーバー起動

```bash
# サーバー (ターミナル1)
cd server
npm run dev

# クライアント (ターミナル2)
cd client
npm start
```

## 🔧 LINE 設定

### 1. Messaging API チャンネル作成

- LINE Developers コンソールでチャンネル作成
- Channel Access Token を取得

### 2. LINE Login チャンネル作成

- LINE Developers コンソールでログインチャンネル作成
- Channel ID と Channel Secret を取得

### 3. LIFF アプリ作成

5 つの LIFF アプリを作成：

- 新規登録用
- アカウント連携用
- 店舗チェックイン用
- デジタル会員証用
- 来店履歴用

### 4. リッチメニュー設定

```bash
cd server
npm run setup-richmenu
```

## 💳 Stripe 設定

### 1. Stripe アカウント作成

- Stripe ダッシュボードで API キー取得
- テスト環境での動作確認

### 2. 決済フロー設定

- Payment Intent を使用した決済処理
- Webhook エンドポイント設定

## 🚀 デプロイ

### Render デプロイ

1. Render アカウント作成
2. GitHub リポジトリ連携
3. 環境変数設定
4. 自動デプロイ設定

### 環境変数（本番）

- 全ての `.env` 設定を Render 環境変数に設定
- LIFF Endpoint URL を本番 URL に更新

## 📊 監視・メンテナンス

### UptimeRobot 設定

- ヘルスチェックエンドポイント監視
- ダウンタイム通知設定

### ログ監視

- サーバーログの定期確認
- エラー率の監視

## 🧪 テスト

```bash
# フロントエンド
cd client
npm test

# バックエンド
cd server
npm test

# 型チェック
npm run type-check
```

## 📝 API ドキュメント

### 認証エンドポイント

- `POST /api/register` - ユーザー登録
- `POST /api/link-line-account` - LINE 連携
- `POST /api/request-password-reset` - パスワードリセット

### 決済エンドポイント

- `POST /api/create-payment-intent` - 決済準備
- `POST /api/webhook/stripe` - Stripe Webhook

### ユーザーエンドポイント

- `POST /api/check-in` - 店舗チェックイン
- `GET /api/membership-card` - 会員証データ
- `GET /api/visit-history` - 来店履歴

## 🔒 セキュリティ

- **Helmet**: セキュリティヘッダー
- **CORS**: オリジン制限
- **Rate Limiting**: API 保護
- **Input Validation**: 入力検証
- **SQL Injection Prevention**: パラメータ化クエリ
- **XSS Protection**: 出力エスケープ

## 🤝 コントリビューション

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 ライセンス

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 サポート

- 📧 Email: support@yoake.com
- 💬 LINE: @yoake_official
- 📖 Docs: https://docs.yoake.com

## 🎯 ロードマップ

### 短期目標 (1-3 ヶ月)

- [ ] ユーザーフィードバック機能
- [ ] プッシュ通知最適化
- [ ] モバイルアプリ対応検討

### 中期目標 (3-6 ヶ月)

- [ ] 他店舗展開サポート
- [ ] 詳細アナリティクス
- [ ] 会員限定イベント機能

### 長期目標 (6-12 ヶ月)

- [ ] AI チャットボット
- [ ] パートナーシップ機能
- [ ] 国際展開対応

---

**Created with ❤️ by YOAKE Team**
