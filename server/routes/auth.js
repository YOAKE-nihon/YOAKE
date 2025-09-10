// routes/auth.js - 認証関連のルート
const express = require("express");
const router = express.Router();

// 新規登録API
router.post("/register", async (req, res) => {
  try {
    // TODO: 実装予定
    res.status(501).json({
      success: false,
      message: "新規登録機能は実装中です。",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "サーバーエラーが発生しました。",
    });
  }
});

// LINEアカウント連携API
router.post("/link-line-account", async (req, res) => {
  try {
    // TODO: 実装予定
    res.status(501).json({
      success: false,
      message: "LINE連携機能は実装中です。",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "サーバーエラーが発生しました。",
    });
  }
});

module.exports = router;
