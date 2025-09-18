// LIFF設定を確認するスクリプト
// server ディレクトリで実行: node check-liff-config.js

require("dotenv").config();
const axios = require("axios");

const CHANNEL_ACCESS_TOKEN = process.env.LINE_MESSAGING_API_TOKEN;

const checkLiffConfig = async () => {
  console.log("=== LIFF設定確認開始 ===");

  if (!CHANNEL_ACCESS_TOKEN) {
    console.error("❌ LINE_MESSAGING_API_TOKENが設定されていません");
    return;
  }

  try {
    // LIFF アプリ一覧を取得
    const response = await axios.get("https://api.line.me/liff/v1/apps", {
      headers: {
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
    });

    const liffApps = response.data.apps;
    console.log(`\n登録済みLIFFアプリ数: ${liffApps.length}\n`);

    // リッチメニューで使用されているLIFF IDのリスト
    const richMenuLiffIds = [
      "2007607164-EKXOr1OD", // 新規登録
      "2007607164-L1kOxwO6", // 会員証表示
      "2007607164-Rje7m170", // 店舗認証
    ];

    liffApps.forEach((app, index) => {
      console.log(`--- LIFF App ${index + 1} ---`);
      console.log(`LIFF ID: ${app.liffId}`);
      console.log(`アプリ名: ${app.view.name}`);
      console.log(`タイプ: ${app.view.type}`);
      console.log(`URL: ${app.view.url}`);
      console.log(`BLE: ${app.features.ble ? "有効" : "無効"}`);
      console.log(
        `QR Code Reader: ${app.features.qrCodeReader ? "有効" : "無効"}`
      );

      // リッチメニューで使用されているかチェック
      if (richMenuLiffIds.includes(app.liffId)) {
        console.log("✅ リッチメニューで使用中");

        // URL の有効性をチェック
        console.log(`📋 設定確認:`);
        console.log(`   エンドポイントURL: ${app.view.url}`);

        // URL が localhost を含んでいる場合は警告
        if (app.view.url.includes("localhost")) {
          console.log("⚠️  警告: localhost URLが設定されています");
          console.log("   本番環境では外部からアクセス可能なURLが必要です");
        }

        // URL が https でない場合は警告
        if (!app.view.url.startsWith("https://")) {
          console.log("❌ エラー: HTTPS URLが必要です");
        }
      } else {
        console.log("ℹ️  リッチメニューで未使用");
      }
      console.log("");
    });

    // リッチメニューで設定されているが、LIFF設定にないIDをチェック
    console.log("=== リッチメニュー設定チェック ===");
    richMenuLiffIds.forEach((richMenuId) => {
      const found = liffApps.find((app) => app.liffId === richMenuId);
      if (found) {
        console.log(`✅ ${richMenuId}: 設定済み (${found.view.url})`);
      } else {
        console.log(`❌ ${richMenuId}: LIFF設定が見つかりません`);
      }
    });
  } catch (error) {
    console.error("\n❌ エラーが発生しました:");
    if (error.response) {
      console.error("ステータスコード:", error.response.status);
      console.error(
        "エラー内容:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error("予期せぬエラー:", error.message);
    }
  }
};

checkLiffConfig();
