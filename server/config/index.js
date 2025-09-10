// server/config/index.js - 設定管理
require("dotenv").config();

const requiredEnvVars = [
  "LINE_LOGIN_CHANNEL_ID",
  "LINE_MESSAGING_API_TOKEN",
  "LIFF_ID_LINKING",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
  "STRIPE_SECRET_KEY",
];

// 環境変数の検証
function validateEnvironment() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`);
    console.warn(
      "Some features may not work properly. Please check your .env file."
    );
  }
}

validateEnvironment();

const config = {
  // LINE設定
  line: {
    loginChannelId: process.env.LINE_LOGIN_CHANNEL_ID,
    loginChannelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET,
    messagingApiToken: process.env.LINE_MESSAGING_API_TOKEN,
    liffIds: {
      register: process.env.REACT_APP_LIFF_ID_REGISTER,
      linking: process.env.LIFF_ID_LINKING,
      checkin: process.env.REACT_APP_LIFF_ID_CHECKIN,
      card: process.env.REACT_APP_LIFF_ID_CARD,
      history: process.env.REACT_APP_LIFF_ID_HISTORY,
    },
    richMenuId: {
      member: process.env.RICH_MENU_ID_MEMBER,
    },
  },

  // データベース設定
  database: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY,
  },

  // 決済設定
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publicKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
  },

  // サーバー設定
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || "development",
  },
};

module.exports = config;
