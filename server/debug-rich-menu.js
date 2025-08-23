// server ディレクトリに保存して実行: node debug-rich-menu.js
require("dotenv").config();
const axios = require("axios");

const CHANNEL_ACCESS_TOKEN = process.env.LINE_MESSAGING_API_TOKEN;
const API_MANAGEMENT_URL = "https://api.line.me/v2/bot/richmenu";

const debugRichMenu = async () => {
  console.log("=== リッチメニューデバッグ開始 ===");
  
  // 1. 環境変数確認
  console.log("\n1. 環境変数確認:");
  console.log("LINE_MESSAGING_API_TOKEN:", CHANNEL_ACCESS_TOKEN ? "設定済み" : "❌未設定");
  console.log("RICH_MENU_ID_MEMBER:", process.env.RICH_MENU_ID_MEMBER ? "設定済み" : "❌未設定");
  
  if (!CHANNEL_ACCESS_TOKEN) {
    console.error("❌ LINE_MESSAGING_API_TOKENが設定されていません");
    return;
  }

  try {
    // 2. 現在のリッチメニュー一覧を取得
    console.log("\n2. 現在のリッチメニュー一覧:");
    const listResponse = await axios.get(`${API_MANAGEMENT_URL}/list`, {
      headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
    });
    
    const menus = listResponse.data.richmenus;
    console.log(`登録済みメニュー数: ${menus.length}`);
    
    menus.forEach((menu, index) => {
      console.log(`  ${index + 1}. ID: ${menu.richMenuId}`);
      console.log(`     名前: ${menu.name}`);
      console.log(`     サイズ: ${menu.size.width}x${menu.size.height}`);
      console.log(`     エリア数: ${menu.areas.length}`);
    });

    // 3. デフォルトリッチメニューを確認
    console.log("\n3. デフォルトリッチメニュー確認:");
    try {
      const defaultResponse = await axios.get("https://api.line.me/v2/bot/user/all/richmenu", {
        headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
      });
      console.log("デフォルトメニューID:", defaultResponse.data.richMenuId);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log("❌ デフォルトリッチメニューが設定されていません");
      } else {
        throw error;
      }
    }

    // 4. 各リッチメニューの詳細を表示
    console.log("\n4. リッチメニューの詳細:");
    for (const menu of menus) {
      console.log(`\n--- ${menu.name || menu.richMenuId} ---`);
      console.log("アクションエリア:");
      menu.areas.forEach((area, i) => {
        console.log(`  ${i + 1}. ${area.action.label || 'ラベルなし'}`);
        console.log(`     URI: ${area.action.uri || 'URIなし'}`);
        console.log(`     位置: (${area.bounds.x}, ${area.bounds.y}) サイズ: ${area.bounds.width}x${area.bounds.height}`);
      });
    }

  } catch (error) {
    console.error("\n❌ エラーが発生しました:");
    if (error.response) {
      console.error("ステータスコード:", error.response.status);
      console.error("エラー内容:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("予期せぬエラー:", error.message);
    }
  }
};

debugRichMenu();
