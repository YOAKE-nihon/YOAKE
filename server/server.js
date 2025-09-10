// server/server.js - メインサーバーファイル
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const config = require("./config");

const app = express();

// セキュリティとミドルウェアの設定
app.use(helmet());
app.use(
  cors({
    origin:
      config.server.nodeEnv === "production"
        ? ["https://your-production-domain.com"]
        : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// レート制限
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト/IP
  message: {
    success: false,
    message: "リクエストが多すぎます。しばらく待ってからお試しください。",
  },
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// リクエストログ
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ヘルスチェックエンドポイント
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ルートハンドラー
app.get("/", (req, res) => {
  res.json({
    message: "YOAKE Server is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// 基本的なAPIエンドポイント（テスト用）
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working!",
    timestamp: new Date().toISOString(),
  });
});

// 404エラーハンドリング
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "エンドポイントが見つかりません。",
  });
});

// グローバルエラーハンドリング
app.use((error, req, res, next) => {
  console.error(`Error in ${req.method} ${req.path}:`, error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "サーバー内部でエラーが発生しました。",
    timestamp: new Date().toISOString(),
  });
});

// プロセス終了時の処理
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// サーバー起動
const server = app.listen(config.server.port, () => {
  console.log(`🚀 YOAKE Server started successfully!`);
  console.log(`📍 Port: ${config.server.port}`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed successfully");
    process.exit(0);
  });
});

module.exports = app;
