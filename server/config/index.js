// server/config/index.js - 設定管理
require('dotenv').config();

const requiredEnvVars = [
  'LINE_LOGIN_CHANNEL_ID',
  'LINE_LOGIN_CHANNEL_SECRET', 
  'LINE_MESSAGING_API_TOKEN',
  'LIFF_ID_LINKING',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'STRIPE_SECRET_KEY'
];

// 環境変数の検証
function validateEnvironment() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
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
      history: process.env.REACT_APP_LIFF_ID_HISTORY
    },
    richMenuId: {
      member: process.env.RICH_MENU_ID_MEMBER
    }
  },
  
  // データベース設定
  database: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY
  },
  
  // 決済設定
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publicKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  },
  
  // サーバー設定
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development'
  }
};

module.exports = config;

// server/utils/logger.js - ログ管理
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  info(message, data = null) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    if (data && this.isDevelopment) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  error(message, error = null) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
    if (error) {
      console.error(error.stack || error);
    }
  }

  warn(message, data = null) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    if (data && this.isDevelopment) {
      console.warn(JSON.stringify(data, null, 2));
    }
  }

  debug(message, data = null) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
      if (data) {
        console.debug(JSON.stringify(data, null, 2));
      }
    }
  }
}

module.exports = new Logger();

// server/utils/errorHandler.js - エラーハンドリング
const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorHandler {
  static handleError(error, req, res, next) {
    logger.error(`Error in ${req.method} ${req.path}:`, error);

    // 既知のエラータイプの処理
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        timestamp: error.timestamp
      });
    }

    // Stripe エラー
    if (error.type && error.type.startsWith('Stripe')) {
      return res.status(400).json({
        success: false,
        message: '決済処理でエラーが発生しました。',
        timestamp: new Date().toISOString()
      });
    }

    // Supabase エラー
    if (error.code && typeof error.code === 'string') {
      return res.status(400).json({
        success: false,
        message: 'データベース処理でエラーが発生しました。',
        timestamp: new Date().toISOString()
      });
    }

    // LINE Bot SDK エラー
    if (error.originalError && error.originalError.response) {
      return res.status(400).json({
        success: false,
        message: 'LINE API処理でエラーが発生しました。',
        timestamp: new Date().toISOString()
      });
    }

    // 予期しないエラー
    return res.status(500).json({
      success: false,
      message: 'サーバー内部でエラーが発生しました。',
      timestamp: new Date().toISOString()
    });
  }

  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = { AppError, ErrorHandler };

// server/services/lineService.js - LINE API関連の処理
const axios = require('axios');
const line = require('@line/bot-sdk');
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');

class LineService {
  constructor() {
    this.client = new line.Client({
      channelAccessToken: config.line.messagingApiToken
    });
  }

  // IDトークンの検証
  async verifyIdToken(idToken) {
    try {
      const params = new URLSearchParams();
      params.append('id_token', idToken);
      params.append('client_id', config.line.loginChannelId);

      const response = await axios.post(
        'https://api.line.me/oauth2/v2.1/verify',
        params,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      logger.debug('LINE token verified successfully', { userId: response.data.sub });
      return response.data;
    } catch (error) {
      logger.error('LINE token verification failed', error);
      throw new AppError('LINE認証に失敗しました。', 401);
    }
  }

  // プッシュメッセージ送信
  async sendLinkingMessage(lineUserId) {
    try {
      const liffUrl = `https://liff.line.me/${config.line.liffIds.linking}`;
      const message = {
        type: 'template',
        altText: 'アカウント連携のお願い',
        template: {
          type: 'buttons',
          title: '会員登録ありがとうございます！',
          text: 'サービスを最大限にご利用いただくため、最後にLINEアカウントとの連携をお願いします。',
          actions: [
            { type: 'uri', label: 'アカウント連携に進む', uri: liffUrl }
          ]
        }
      };

      await this.client.pushMessage(lineUserId, [message]);
      logger.info('Linking message sent successfully', { lineUserId });
    } catch (error) {
      logger.warn('Failed to send linking message', error);
      // プッシュメッセージの失敗は致命的ではないので例外を投げない
    }
  }

  // リッチメニューの紐付け
  async linkRichMenuToUser(lineUserId, richMenuId) {
    try {
      await this.client.linkRichMenuToUser(lineUserId, richMenuId);
      logger.info('Rich menu linked successfully', { lineUserId, richMenuId });
    } catch (error) {
      logger.error('Rich menu linking failed', error);
      throw new AppError('リッチメニューの設定に失敗しました。', 500);
    }
  }
}

module.exports = new LineService();

// server/services/databaseService.js - データベース関連の処理
const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');

class DatabaseService {
  constructor() {
    this.supabase = createClient(config.database.supabaseUrl, config.database.supabaseKey);
  }

  // ユーザーの作成または取得
  async createOrGetUser(email, lineProfile) {
    try {
      const { data: { users }, error: listError } = await this.supabase.auth.admin.listUsers({ email });
      
      if (listError) throw listError;

      if (users && users.length > 0) {
        logger.debug('Existing user found', { email, userId: users[0].id });
        return users[0];
      }

      const { data: { user }, error: createError } = await this.supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name: lineProfile.name, picture: lineProfile.picture }
      });

      if (createError) throw createError;
      
      logger.info('New user created', { email, userId: user.id });
      return user;
    } catch (error) {
      logger.error('User creation/retrieval failed', error);
      throw new AppError('ユーザー情報の処理に失敗しました。', 500);
    }
  }

  // プロフィール情報の保存
  async upsertProfile(userId, profileData) {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...profileData,
          updated_at: new Date()
        });

      if (error) throw error;
      logger.debug('Profile upserted successfully', { userId });
    } catch (error) {
      logger.error('Profile upsert failed', error);
      throw new AppError('プロフィール情報の保存に失敗しました。', 500);
    }
  }

  // アンケート回答の保存
  async upsertSurveyResponse(userId, surveyData) {
    try {
      const { error } = await this.supabase
        .from('survey_responses')
        .upsert(
          { user_id: userId, ...surveyData },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      logger.debug('Survey response upserted successfully', { userId });
    } catch (error) {
      logger.error('Survey response upsert failed', error);
      throw new AppError('アンケート回答の保存に失敗しました。', 500);
    }
  }

  // ユーザーIDの取得（LINE User IDから）
  async getUserIdByLineUserId(lineUserId) {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('line_user_id', lineUserId)
        .single();

      if (error || !profile) {
        throw new AppError('ユーザーが見つかりません。', 404);
      }

      return profile.id;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('User ID retrieval failed', error);
      throw new AppError('ユーザー情報の取得に失敗しました。', 500);
    }
  }

  // 来店記録の作成
  async createVisitRecord(userId, storeId) {
    try {
      const { data: visit, error } = await this.supabase
        .from('visits')
        .insert({
          user_id: userId,
          store_id: storeId
        })
        .select('id')
        .single();

      if (error) throw error;
      logger.info('Visit record created', { userId, storeId, visitId: visit.id });
      return visit.id;
    } catch (error) {
      logger.error('Visit record creation failed', error);
      throw new AppError('来店記録の作成に失敗しました。', 500);
    }
  }

  // 来店アンケートの更新
  async updateVisitSurvey(visitId, surveyData) {
    try {
      const { error } = await this.supabase
        .from('visits')
        .update(surveyData)
        .eq('id', visitId);

      if (error) throw error;
      logger.debug('Visit survey updated successfully', { visitId });
    } catch (error) {
      logger.error('Visit survey update failed', error);
      throw new AppError('アンケート情報の更新に失敗しました。', 500);
    }
  }

  // 会員証データの取得
  async getMembershipCardData(lineUserId) {
    try {
      const userId = await this.getUserIdByLineUserId(lineUserId);

      // プロフィール情報取得
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // 来店履歴取得
      const { data: visits, error: visitsError } = await this.supabase
        .from('visits')
        .select(`
          check_in_at,
          visit_purpose,
          companion_industries,
          companion_job_types,
          stores (name)
        `)
        .eq('user_id', userId)
        .order('check_in_at', { ascending: false });

      if (visitsError) throw visitsError;

      // データ集計
      const cardData = this._aggregateVisitData(profile, visits);
      logger.debug('Membership card data retrieved', { userId, visitsCount: visits.length });
      
      return cardData;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Membership card data retrieval failed', error);
      throw new AppError('会員証データの取得に失敗しました。', 500);
    }
  }

  // 来店履歴の取得
  async getVisitHistory(lineUserId) {
    try {
      const userId = await this.getUserIdByLineUserId(lineUserId);

      const { data: visits, error } = await this.supabase
        .from('visits')
        .select(`
          id,
          check_in_at,
          visit_purpose,
          stores (name)
        `)
        .eq('user_id', userId)
        .order('check_in_at', { ascending: false });

      if (error) throw error;

      const formattedVisits = visits.map(v => ({
        id: v.id,
        check_in_at: v.check_in_at,
        visit_purpose: v.visit_purpose,
        store_name: v.stores.name
      }));

      logger.debug('Visit history retrieved', { userId, count: visits.length });
      return formattedVisits;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Visit history retrieval failed', error);
      throw new AppError('来店履歴の取得に失敗しました。', 500);
    }
  }

  // プライベートメソッド: 来店データの集計
  _aggregateVisitData(profile, visits) {
    const allCompanionIndustries = visits.flatMap(v => v.companion_industries || []);
    const allCompanionJobTypes = visits.flatMap(v => v.companion_job_types || []);
    const allVisitPurposes = visits.map(v => v.visit_purpose).filter(Boolean);

    const aggregateCounts = (arr) => arr.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});

    const storeVisits = aggregateCounts(visits.map(v => v.stores.name));
    const favoriteStore = Object.keys(storeVisits).sort((a, b) => storeVisits[b] - storeVisits[a])[0] || 'なし';

    return {
      profile: {
        name: profile.name,
        avatarUrl: profile.avatar_url
      },
      stats: {
        totalVisits: visits.length,
        favoriteStore,
        recentVisits: visits.slice(0, 2).map(v => ({
          date: v.check_in_at,
          storeName: v.stores.name
        }))
      },
      charts: {
        companionIndustry: aggregateCounts(allCompanionIndustries),
        companionJobType: aggregateCounts(allCompanionJobTypes),
        visitPurpose: aggregateCounts(allVisitPurposes)
      }
    };
  }
}

module.exports = new DatabaseService();

// server/services/stripeService.js - 決済関連の処理
const stripe = require('stripe')(require('../config').stripe.secretKey);
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');

class StripeService {
  // 顧客の作成
  async createCustomer(email, name, metadata) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata
      });

      logger.info('Stripe customer created', { customerId: customer.id, email });
      return customer;
    } catch (error) {
      logger.error('Stripe customer creation failed', error);
      throw new AppError('顧客情報の作成に失敗しました。', 500);
    }
  }

  // 支払いインテントの作成
  async createPaymentIntent(amount, currency, customerId) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount),
        currency,
        customer: customerId
      });

      logger.info('Payment intent created', { 
        paymentIntentId: paymentIntent.id, 
        amount, 
        customerId 
      });
      
      return paymentIntent;
    } catch (error) {
      logger.error('Payment intent creation failed', error);
      throw new AppError('決済情報の作成に失敗しました。', 500);
    }
  }
}

module.exports = new StripeService();
