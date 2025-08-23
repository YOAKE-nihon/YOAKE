// server/server.js - メインサーバーファイル
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // セキュリティ強化（npm install helmet）
const rateLimit = require('express-rate-limit'); // レート制限（npm install express-rate-limit）

const config = require('./config');
const logger = require('./utils/logger');
const { ErrorHandler } = require('./utils/errorHandler');

// サービス層のインポート
const lineService = require('./services/lineService');
const databaseService = require('./services/databaseService');
const stripeService = require('./services/stripeService');

const app = express();

// セキュリティとミドルウェアの設定
app.use(helmet());
app.use(cors({
  origin: config.server.nodeEnv === 'production' 
    ? ['https://your-production-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// レート制限
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト/IP
  message: {
    success: false,
    message: 'リクエストが多すぎます。しばらく待ってからお試しください。'
  }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// リクエストログ
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip, 
    userAgent: req.get('User-Agent')
  });
  next();
});

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API ルート定義

/**
 * 新規登録API
 */
app.post('/api/register', ErrorHandler.asyncHandler(async (req, res) => {
  const { idToken, surveyData } = req.body;
  
  // バリデーション
  if (!idToken || !surveyData || !surveyData.email) {
    return res.status(400).json({
      success: false,
      message: '必要な情報が不足しています。'
    });
  }

  // LINE IDトークン検証
  const lineProfile = await lineService.verifyIdToken(idToken);
  const lineUserId = lineProfile.sub;

  // ユーザー作成または取得
  const user = await databaseService.createOrGetUser(surveyData.email, lineProfile);

  // Stripe顧客作成
  const stripeCustomer = await stripeService.createCustomer(
    surveyData.email,
    lineProfile.name,
    { 
      supabase_user_id: user.id, 
      line_user_id: lineUserId 
    }
  );

  // プロフィール情報保存
  await databaseService.upsertProfile(user.id, {
    name: lineProfile.name,
    avatar_url: lineProfile.picture,
    line_user_id: lineUserId,
    email: surveyData.email,
    gender: surveyData.gender,
    birth_date: surveyData.birthDate,
    phone: surveyData.phone,
    experience_years: surveyData.experienceYears,
    industry: surveyData.industry,
    job_type: surveyData.jobType,
    stripe_customer_id: stripeCustomer.id
  });

  // アンケート回答保存
  await databaseService.upsertSurveyResponse(user.id, surveyData);

  // LINE連携メッセージ送信
  await lineService.sendLinkingMessage(lineUserId);

  logger.info('User registration completed', { 
    userId: user.id, 
    lineUserId,
    email: surveyData.email 
  });

  res.status(201).json({
    success: true,
    message: 'ユーザー登録が完了しました。',
    stripeCustomerId: stripeCustomer.id
  });
}));

/**
 * 決済インテント作成API
 */
app.post('/api/create-payment-intent', ErrorHandler.asyncHandler(async (req, res) => {
  const { amount, email, stripeCustomerId } = req.body;

  // バリデーション
  if (!amount || !email || !stripeCustomerId) {
    return res.status(400).json({
      success: false,
      message: '決済情報が不足しています。'
    });
  }

  const paymentIntent = await stripeService.createPaymentIntent(
    amount,
    'jpy',
    stripeCustomerId
  );

  res.json({
    success: true,
    clientSecret: paymentIntent.client_secret
  });
}));

/**
 * LINE アカウント連携API
 */
app.post('/api/link-line-account', ErrorHandler.asyncHandler(async (req, res) => {
  const { email, lineUserId } = req.body;

  if (!email || !lineUserId) {
    return res.status(400).json({
      success: false,
      message: '連携情報が不足しています。'
    });
  }

  // リッチメニュー紐付け
  if (config.line.richMenuId.member) {
    await lineService.linkRichMenuToUser(lineUserId, config.line.richMenuId.member);
  }

  logger.info('Account linking completed', { email, lineUserId });

  res.json({
    success: true,
    message: 'アカウント連携が完了しました。'
  });
}));

/**
 * 店舗チェックインAPI
 */
app.post('/api/check-in', ErrorHandler.asyncHandler(async (req, res) => {
  const { lineUserId, storeId } = req.body;

  if (!lineUserId || !storeId) {
    return res.status(400).json({
      success: false,
      message: 'チェックイン情報が不足しています。'
    });
  }

  const userId = await databaseService.getUserIdByLineUserId(lineUserId);
  const visitId = await databaseService.createVisitRecord(userId, storeId);

  res.status(201).json({
    success: true,
    visitId
  });
}));

/**
 * 来店アンケート送信API
 */
app.post('/api/submit-visit-survey', ErrorHandler.asyncHandler(async (req, res) => {
  const { visitId, visitType, visitPurpose, companionIndustries, companionJobTypes } = req.body;

  if (!visitId) {
    return res.status(400).json({
      success: false,
      message: '来店記録IDが必要です。'
    });
  }

  const surveyData = {
    visit_type: visitType,
    visit_purpose: visitPurpose,
    companion_industries: companionIndustries || [],
    companion_job_types: companionJobTypes || []
  };

  await databaseService.updateVisitSurvey(visitId, surveyData);

  res.json({
    success: true,
    message: 'アンケートの送信が完了しました。'
  });
}));

/**
 * 会員証データ取得API
 */
app.get('/api/membership-card', ErrorHandler.asyncHandler(async (req, res) => {
  const { lineUserId } = req.query;

  if (!lineUserId) {
    return res.status(400).json({
      success: false,
      message: 'ユーザー情報が不足しています。'
    });
  }

  const cardData = await databaseService.getMembershipCardData(lineUserId);

  res.json({
    success: true,
    data: cardData
  });
}));

/**
 * 来店履歴取得API
 */
app.get('/api/visit-history', ErrorHandler.asyncHandler(async (req, res) => {
  const { lineUserId } = req.query;

  if (!lineUserId) {
    return res.status(400).json({
      success: false,
      message: 'ユーザー情報が不足しています。'
    });
  }

  const history = await databaseService.getVisitHistory(lineUserId);

  res.json({
    success: true,
    data: history
  });
}));

// 404エラーハンドリング
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'エンドポイントが見つかりません。'
  });
});

// グローバルエラーハンドリング
app.use(ErrorHandler.handleError);

// プロセス終了時の処理
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// サーバー起動
const server = app.listen(config.server.port, () => {
  logger.info(`🚀 YOAKE Server started successfully!`, {
    port: config.server.port,
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });
});

module.exports = app;
