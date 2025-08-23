// server ディレクトリに保存して実行: node update-richmenu-urls.js
require("dotenv").config();
const fs = require("fs");

// 新しいLIFF IDを設定してください (Step 4で取得したもの)
const LIFF_IDS = {
  REGISTER: "あなたの新規登録用LIFF_ID",     // 例: 2007607160-ABC123XY
  CARD: "あなたの会員証用LIFF_ID",         // 例: 2007607160-DEF456XY  
  CHECKIN: "あなたの店舗認証用LIFF_ID",    // 例: 2007607160-GHI789XY
  LINKING: "あなたのアカウント連携用LIFF_ID" // 例: 2007607160-JKL012XY
};

// ゲスト用リッチメニュー設定を更新
const guestMenuDefinition = {
  "size": { "width": 2500, "height": 1686 },
  "selected": true,
  "name": "新規ゲスト向けメニュー", 
  "chatBarText": "メニュー",
  "areas": [
    {
      "bounds": { "x": 0, "y": 0, "width": 1250, "height": 843 },
      "action": { 
        "type": "uri", 
        "label": "新規登録", 
        "uri": `https://liff.line.me/${LIFF_IDS.REGISTER}` 
      }
    },
    {
      "bounds": { "x": 1250, "y": 0, "width": 1250, "height": 843 },
      "action": { 
        "type": "uri", 
        "label": "アプリの使い方", 
        "uri": "https://your-website.com/" 
      }
    },
    {
      "bounds": { "x": 0, "y": 843, "width": 833.33, "height": 843 },
      "action": { 
        "type": "uri", 
        "label": "ドリンク一覧", 
        "uri": "https://your-website.com/" 
      }
    },
    {
      "bounds": { "x": 833.33, "y": 843, "width": 833.33, "height": 843 },
      "action": { 
        "type": "uri", 
        "label": "提携希望", 
        "uri": "https://your-website.com/" 
      }
    },
    {
      "bounds": { "x": 1666.66, "y": 843, "width": 833.33, "height": 843 },
      "action": { 
        "type": "uri", 
        "label": "Q&A", 
        "uri": "https://your-website.com/" 
      }
    }
  ]
};

// 会員用リッチメニュー設定を更新  
const memberMenuDefinition = {
  "size": { "width": 2500, "height": 1686 },
  "selected": true,
  "name": "会員向けメニュー",
  "chatBarText": "メニュー", 
  "areas": [
    {
      "bounds": { "x": 0, "y": 0, "width": 833.33, "height": 843 },
      "action": { 
        "type": "uri", 
        "label": "会員証表示", 
        "uri": `https://liff.line.me/${LIFF_IDS.CARD}` 
      }
    },
    {
      "bounds": { "x": 833.33, "y": 0, "width": 833.33, "height": 843 },
      "action": { 
        "type": "uri", 
        "label": "店舗認証", 
        "uri": `https://liff.line.me/${LIFF_IDS.CHECKIN}` 
      }
    },
    {
      "bounds": { "x": 1666.66, "y": 0, "width": 833.33, "height": 843 },
      "action": { 
        "type": "uri", 
        "label": "アプリの使い方", 
        "uri": "https://your-website.com/" 
      }
    },
    {
      "bounds": { "x": 0, "y": 843, "width": 833.33, "height": 843 },
      "action": { 
        "type": "uri", 
        "label": "ドリンク一覧", 
        "uri": "https://your-website.com/" 
      }
    },
    {
      "bounds": { "x": 833.33, "y": 843, "width": 833.33, "height": 843 },
      "action": { 
        "type": "uri", 
        "label": "提携希望", 
        "uri": "https://your-website.com/" 
      }
    },
    {
      "bounds": { "x": 1666.66, "y": 843, "width": 833.33, "height": 843 },
      "action": { 
        "type": "uri", 
        "label": "Q&A", 
        "uri": "https://your-website.com/" 
      }
    }
  ]
};

// ファイルに保存
fs.writeFileSync(
  "./richmenu-guest-definition.json", 
  JSON.stringify(guestMenuDefinition, null, 2)
);

fs.writeFileSync(
  "./richmenu-member-definition.json",
  JSON.stringify(memberMenuDefinition, null, 2) 
);

console.log("✅ リッチメニュー設定ファイルを更新しました");
console.log("👉 次のステップ:");
console.log("1. LIFF_IDS の値を実際のLIFF IDに更新してください");
console.log("2. node setup-rich-menus.js を実行してください");
