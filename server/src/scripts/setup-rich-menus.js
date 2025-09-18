// このスクリプトは、2種類のリッチメニューを作成・設定するために一度だけ手動で実行します。
// 実行コマンド: node setup-rich-menus.js

require("dotenv").config();
const fs = require("fs");
const axios = require("axios");

const CHANNEL_ACCESS_TOKEN = process.env.LINE_MESSAGING_API_TOKEN;

const API_MANAGEMENT_URL = "https://api.line.me/v2/bot/richmenu"; // 設計図などを管理するAPI
const API_CONTENT_URL = "https://api-data.line.me/v2/bot/richmenu"; // 画像などのコンテンツを扱うAPI

// ★★★ 修正点: デフォルトリッチメニュー設定用のURLを別途定義 ★★★
const API_SET_DEFAULT_URL = "https://api.line.me/v2/bot/user/all/richmenu"; // 全ユーザーのデフォルトメニューを設定するAPI

// リッチメニューの定義
const menus = [
  {
    name: "guest",
    definition: JSON.parse(fs.readFileSync("./richmenu-guest-definition.json")),
    imagePath: "./richmenu-guest.jpg", // ゲスト用画像へのパス (もしPNGなら .png に変更)
    imageType: "image/jpeg", // ゲスト用画像の形式 (もしPNGなら 'image/png' に変更)
  },
  {
    name: "member",
    definition: JSON.parse(
      fs.readFileSync("./richmenu-member-definition.json")
    ),
    imagePath: "./richmenu-member.jpg", // 会員用画像へのパス (もしPNGなら .png に変更)
    imageType: "image/jpeg", // 会員用画像の形式 (もしPNGなら 'image/png' に変更)
  },
];

// リッチメニューを作成し、画像をアップロードする非同期関数
const createMenu = async (menu) => {
  console.log(`--- ${menu.name} リッチメニューの作成を開始 ---`);

  const createResponse = await axios.post(API_MANAGEMENT_URL, menu.definition, {
    headers: {
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  const richMenuId = createResponse.data.richMenuId;
  console.log(`[${menu.name}] 作成成功。Rich Menu ID: ${richMenuId}`);

  console.log(
    `[${menu.name}] 画像(${menu.imagePath})をアップロードしています...`
  );
  await axios.post(
    `${API_CONTENT_URL}/${richMenuId}/content`,
    fs.createReadStream(menu.imagePath),
    {
      headers: {
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
        "Content-Type": menu.imageType,
      },
    }
  );
  console.log(`[${menu.name}] 画像のアップロード成功。`);

  return richMenuId;
};

// メインの実行関数
const setupRichMenus = async () => {
  if (!CHANNEL_ACCESS_TOKEN) {
    return console.error(
      "エラー: .envファイルにLINE_MESSAGING_API_TOKENを設定してください。"
    );
  }

  try {
    // 既存のリッチメニューをすべて削除して、クリーンな状態から始める（推奨）
    console.log("--- 既存のリッチメニューをすべて削除しています... ---");
    const listResponse = await axios.get(`${API_MANAGEMENT_URL}/list`, {
      headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
    });
    for (const menu of listResponse.data.richmenus) {
      await axios.delete(`${API_MANAGEMENT_URL}/${menu.richMenuId}`, {
        headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
      });
      console.log(`削除しました: ${menu.richMenuId}`);
    }
    console.log("既存リッチメニューの削除完了。");

    const guestMenuId = await createMenu(menus[0]);
    const memberMenuId = await createMenu(menus[1]);

    // 3. ゲスト用メニューをデフォルトとして設定 (★★★ 修正点: 正しいURLを使用 ★★★)
    console.log("\n--- ゲスト用メニューをデフォルトに設定中 ---");
    await axios.post(
      `${API_SET_DEFAULT_URL}/${guestMenuId}`, // ← 正しいURLに変更
      {},
      { headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` } }
    );
    console.log("デフォルトリッチメニューの設定完了。");

    console.log("\n✅✅✅ すべての処理が完了しました！ ✅✅✅");
    console.log("----------------------------------------------------");
    console.log("【ゲスト用】Rich Menu ID:", guestMenuId);
    console.log("【会員用】  Rich Menu ID:", memberMenuId);
    console.log("\n👉 次のステップ:");
    console.log(`1. 上記の【会員用】Rich Menu IDをコピーしてください。`);
    console.log(
      `2. server/.env ファイルを開き、RICH_MENU_ID_MEMBER= の値として貼り付けてください。`
    );
    console.log("----------------------------------------------------");
  } catch (error) {
    console.error("\n❌ エラーが発生しました ❌");
    if (error.code === "ENOENT") {
      console.error(`ファイルが見つかりません: ${error.path}`);
      console.error(
        "スクリプト内の imagePath の設定が正しいか、ファイルが存在するか確認してください。"
      );
    } else if (error.response) {
      console.error("ステータスコード:", error.response.status);
      console.error(
        "エラー内容:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error("予期せぬエラー:", error);
    }
  }
};

setupRichMenus();
