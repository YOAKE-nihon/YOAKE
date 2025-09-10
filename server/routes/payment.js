// routes/payment.js - 決済関連のルート
const express = require("express");
const router = express.Router();

// 決済インテント作成API
router.post("/create-payment-intent", async (req, res) => {
  try {
    // TODO: 実装予定
    res.status(501).json({
      success: false,
      message: "決済機能は実装中です。",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "サーバーエラーが発生しました。",
    });
  }
});

module.exports = router;
