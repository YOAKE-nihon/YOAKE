import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  line: {
    loginChannelId: string;
    loginChannelSecret: string;
    messagingApiToken: string;
    liffIds: {
      register?: string;
      linking: string;
      checkin?: string;
      card?: string;
      history?: string;
    };
    richMenuId: {
      member?: string;
    };
  };
  database: {
    supabaseUrl: string;
    supabaseKey: string;
  };
  stripe: {
    secretKey: string;
    publicKey?: string;
  };
  server: {
    port: number;
    nodeEnv: string;
  };
}

const config: Config = {
  line: {
    loginChannelId: process.env.LINE_LOGIN_CHANNEL_ID || '',
    loginChannelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET || '',
    messagingApiToken: process.env.LINE_MESSAGING_API_TOKEN || '',
    liffIds: {
      register: process.env.LIFF_ID_REGISTER,
      linking: process.env.LIFF_ID_LINKING || '',
      checkin: process.env.LIFF_ID_CHECKIN,
      card: process.env.LIFF_ID_CARD,
      history: process.env.LIFF_ID_HISTORY,
    },
    richMenuId: {
      member: process.env.RICH_MENU_ID_MEMBER,
    },
  },
  database: {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};

// Validation
const validateConfig = (): void => {
  const required = [
    'LINE_MESSAGING_API_TOKEN',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'STRIPE_SECRET_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate configuration on import
if (config.server.nodeEnv === 'production') {
  validateConfig();
}

export { config };

// Individual config exports for convenience
export const lineConfig = config.line;
export const databaseConfig = config.database;
export const stripeConfig = config.stripe;
export const serverConfig = config.server;