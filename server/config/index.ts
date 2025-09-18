import dotenv from 'dotenv';
import { Config } from '../types';

// Load environment variables
dotenv.config();

const requiredEnvVars = [
  'LINE_LOGIN_CHANNEL_ID',
  'LINE_MESSAGING_API_TOKEN',
  'LIFF_ID_LINKING',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'STRIPE_SECRET_KEY',
] as const;

/**
 * Validate that all required environment variables are present
 */
function validateEnvironment(): void {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('Some features may not work properly. Please check your .env file.');
  } else {
    console.log('✅ All required environment variables are present');
  }
}

/**
 * Get environment variable with type safety and validation
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not provided`);
  }
  return value;
}

/**
 * Get optional environment variable
 */
function getOptionalEnvVar(key: string): string | undefined {
  return process.env[key];
}

/**
 * Get numeric environment variable with validation
 */
function getNumericEnvVar(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
}

// Validate environment on startup
validateEnvironment();

export const config: Config = {
  // LINE configuration
  line: {
    loginChannelId: getEnvVar('LINE_LOGIN_CHANNEL_ID'),
    loginChannelSecret: getOptionalEnvVar('LINE_LOGIN_CHANNEL_SECRET'),
    messagingApiToken: getEnvVar('LINE_MESSAGING_API_TOKEN'),
    liffIds: {
      register: getOptionalEnvVar('REACT_APP_LIFF_ID_REGISTER'),
      linking: getEnvVar('LIFF_ID_LINKING'),
      checkin: getOptionalEnvVar('REACT_APP_LIFF_ID_CHECKIN'),
      card: getOptionalEnvVar('REACT_APP_LIFF_ID_CARD'),
      history: getOptionalEnvVar('REACT_APP_LIFF_ID_HISTORY'),
    },
    richMenuId: {
      member: getOptionalEnvVar('RICH_MENU_ID_MEMBER'),
    },
  },

  // Database configuration
  database: {
    supabaseUrl: getEnvVar('SUPABASE_URL'),
    supabaseKey: getEnvVar('SUPABASE_SERVICE_KEY'),
  },

  // Payment configuration
  stripe: {
    secretKey: getEnvVar('STRIPE_SECRET_KEY'),
    publicKey: getOptionalEnvVar('REACT_APP_STRIPE_PUBLISHABLE_KEY'),
  },

  // Server configuration
  server: {
    port: getNumericEnvVar('PORT', 3001),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
  },
};

// Export individual config sections for convenience
export const {
  line: lineConfig,
  database: databaseConfig,
  stripe: stripeConfig,
  server: serverConfig,
} = config;

// Environment helpers
export const isDevelopment = config.server.nodeEnv === 'development';
export const isProduction = config.server.nodeEnv === 'production';
export const isTesting = config.server.nodeEnv === 'test';

// Logging configuration
export const logLevel = isDevelopment ? 'debug' : 'info';

// CORS configuration
export const corsOptions = {
  origin: isProduction
    ? ['https://your-production-domain.com', 'https://liff.line.me']
    : ['http://localhost:3000', 'http://localhost:3001', 'https://liff.line.me'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // requests per window
  message: {
    success: false,
    message: 'リクエストが多すぎます。しばらく待ってからお試しください。',
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// Validation and logging
if (isDevelopment) {
  console.log('🔧 Development mode - enhanced logging enabled');
}

if (isProduction) {
  console.log('🚀 Production mode - optimized for performance');
}

export default config;