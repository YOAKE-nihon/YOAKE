// プロジェクトルートで実行: node generate-env-files-final.js
const fs = require('fs');
const path = require('path');

// 実際の設定値
const CONFIG = {
  // Messaging APIチャンネル
  MESSAGING_CHANNEL_ID: "2007978746",
  MESSAGING_ACCESS_TOKEN: "FsMhhMShk0...", // 実際の完全なトークンに置き換え
  
  // LINEログインチャンネル
  LOGIN_CHANNEL_ID: "2007978802",
  LOGIN_CHANNEL_SECRET: "2faf520e1b...", // 実際の完全なSecretに置き換え
  
  // LIFFアプリID
  LIFF_ID_REGISTER: "2007978802-kl7x0PMw",
  LIFF_ID_CARD: "2007978802-GbqBXmYM",
  LIFF_ID_CHECKIN: "2007978802-Vy612enm",
  LIFF_ID_LINKING: "2007978802-04admwb1",
  LIFF_ID_HISTORY: "2007978802-W5JDqwGk",
  
  // その他（既存の設定があれば更新）
  SUPABASE_URL: "your_supabase_url_here",
  SUPABASE_SERVICE_KEY: "your_supabase_service_key_here",
  STRIPE_SECRET_KEY: "your_stripe_secret_key_here",
  STRIPE_PUBLISHABLE_KEY: "your_stripe_publishable_key_here"
};

// server/.env ファイル生成
const serverEnv = `# YOAKE サーバー側環境変数（更新: ${new Date().toISOString()})

# LINE設定
LINE_LOGIN_CHANNEL_ID=${CONFIG.LOGIN_CHANNEL_ID}
LINE_LOGIN_CHANNEL_SECRET=${CONFIG.LOGIN_CHANNEL_SECRET}
LINE_MESSAGING_API_TOKEN=${CONFIG.MESSAGING_ACCESS_TOKEN}
LIFF_ID_LINKING=${CONFIG.LIFF_ID_LINKING}

# データベース
SUPABASE_URL=${CONFIG.SUPABASE_URL}
SUPABASE_SERVICE_KEY=${CONFIG.SUPABASE_SERVICE_KEY}

# 決済
STRIPE_SECRET_KEY=${CONFIG.STRIPE_SECRET_KEY}

# その他
PORT=3001
RICH_MENU_ID_MEMBER=
`;

// client/.env ファイル生成
const clientEnv = `# YOAKE クライアント側環境変数（更新: ${new Date().toISOString()})

# LIFF設定
REACT_APP_LIFF_ID_REGISTER=${CONFIG.LIFF_ID_REGISTER}
REACT_APP_LIFF_ID_LINKING=${CONFIG.LIFF_ID_LINKING}
REACT_APP_LIFF_ID_CHECKIN=${CONFIG.LIFF_ID_CHECKIN}
REACT_APP_LIFF_ID_CARD=${CONFIG.LIFF_ID_CARD}
REACT_APP_LIFF_ID_HISTORY=${CONFIG.LIFF_ID_HISTORY}

# 決済
REACT_APP_STRIPE_PUBLISHABLE_KEY=${CONFIG.STRIPE_PUBLISHABLE_KEY}
`;

// ファイル書き込み
try {
  // server/.env
  fs.writeFileSync(path.join(__dirname, 'server', '.env'), serverEnv);
  console.log('✅ server/.env ファイルを更新しました');
  
  // client/.env
  fs.writeFileSync(path.join(__dirname, 'client', '.env'), clientEnv);
  console.log('✅ client/.env ファイルを更新しました');
  
  console.log('\n🎉 LINE設定が完了しました！');
  console.log('\n📋 現在の設定:');
  console.log(`Messaging API Channel: ${CONFIG.MESSAGING_CHANNEL_ID}`);
  console.log(`LINE Login Channel: ${CONFIG.LOGIN_CHANNEL_ID}`);
  console.log(`LIFF Apps: 5個作成済み`);
  
  console.log('\n👉 次のステップ:');
  console.log('1. 完全なAccess TokenとChannel Secretを .env ファイルに追加');
  console.log('2. Supabase, Stripe の設定も追加');
  console.log('3. cd server && node setup-rich-menus.js でリッチメニュー作成');
  console.log('4. 開発サーバー起動でテスト');
  
} catch (error) {
  console.error('❌ ファイル生成エラー:', error.message);
}
