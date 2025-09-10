// routes/user.js - ユーザー関連のルート
const express = require("express");
const router = express.Router();

// 店舗チェックインAPI
router.post("/check-in", async (req, res) => {
  try {
    // TODO: 実装予定
    res.status(501).json({
      success: false,
      message: "チェックイン機能は実装中です。",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "サーバーエラーが発生しました。",
    });
  }
});

// 来店アンケート送信API
router.post("/submit-visit-survey", async (req, res) => {
  try {
    // TODO: 実装予定
    res.status(501).json({
      success: false,
      message: "アンケート機能は実装中です。",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "サーバーエラーが発生しました。",
    });
  }
});

// 会員証データ取得API
router.get("/membership-card", async (req, res) => {
  try {
    // TODO: 実装予定
    res.status(501).json({
      success: false,
      message: "会員証機能は実装中です。",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "サーバーエラーが発生しました。",
    });
  }
});

// 来店履歴取得API
router.get("/visit-history", async (req, res) => {
  try {
    // TODO: 実装予定
    res.status(501).json({
      success: false,
      message: "来店履歴機能は実装中です。",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "サーバーエラーが発生しました。",
    });
  }
});

module.exports = router;
