import dotenv from 'dotenv';
import { Config } from '../types';

// Load environment variables
dotenv.config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'LINE_MESSAGING_API_TOKEN',
  'STRIPE_SECRET_KEY'
];

// Check required environment variables
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
});

export const config: Config = {
  line: {
    loginChannelId: process.env.LINE_LOGIN_CHANNEL_ID || '',
    loginChannelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET,
    messagingApiToken: process.env.LINE_MESSAGING_API_TOKEN!,
    messagingChannelSecret: process.env.LINE_MESSAGING_CHANNEL_SECRET,
    liffIds: {
      register: process.env.LIFF_ID_REGISTER,
      linking: process.env.LIFF_ID_LINKING!,
      checkin: process.env.LIFF_ID_CHECKIN,
      card: process.env.LIFF_ID_CARD,
      history: process.env.LIFF_ID_HISTORY,
    },
    richMenuId: {
      member: process.env.RICH_MENU_ID_MEMBER,
    },
  },
  database: {
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY!,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};

// Derived configurations
export const lineConfig = config.line;
export const databaseConfig = config.database;
export const stripeConfig = config.stripe;
export const serverConfig = config.server;