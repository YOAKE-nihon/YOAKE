import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import {
  securityMiddleware,
  rateLimitMiddleware,
  corsOptions,
  requestLogger,
  errorHandler,
  healthCheck,
  asyncWrapper
} from './middleware';

// Import routes
import authRoutes from './routes/auth';
import paymentRoutes from './routes/payment';
import userRoutes from './routes/user';
//import webhookRoutes from './routes/webhook';

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Basic middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.line.me", "https://api.stripe.com"],
    },
  },
}));

app.use(cors(corsOptions));
app.use(requestLogger);
app.use(rateLimitMiddleware);

// Body parsing middleware
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));
app.use('/api/webhook/line', express.raw({ type: 'application/json' }));
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', healthCheck);

// Root path handling
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'YOAKE API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      frontend: 'https://yoake-frontend.onrender.com'
    }
  });
});

// Handle HEAD requests to root (for health checks)
app.head('/', (req, res) => {
  res.status(200).end();
});

// API routes
app.use('/api', authRoutes);
app.use('/api', paymentRoutes);
app.use('/api', userRoutes);
//app.use('/api', webhookRoutes);

// Basic API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    requestId: Math.random().toString(36).substr(2, 9),
  });
});

// LINE webhook endpoint (legacy - keep for backward compatibility)
app.post('/api/webhook/line', asyncWrapper(async (req: express.Request, res: express.Response) => {
  try {
    const signature = req.headers['x-line-signature'] as string;
    
    if (!signature) {
      res.status(400).json({ error: 'Missing signature' });
      return;
    }

    // Validate signature
    const body = req.body.toString();
    const { lineService } = await import('./services/line');
    const isValid = lineService.validateSignature(body, signature);
    
    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Parse events
    const events = JSON.parse(body).events;
    
    // Process each event
    for (const event of events) {
      await lineService.handleWebhookEvent(event);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('LINE webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}));

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `エンドポイント ${req.method} ${req.originalUrl} が見つかりません`,
    timestamp: new Date().toISOString(),
    suggestion: 'フロントエンドには https://yoake-frontend.onrender.com でアクセスしてください'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received, starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle process termination
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const server = app.listen(config.server.port, () => {
  console.log('🚀 YOAKE Server started successfully!');
  console.log(`📡 Server listening on port ${config.server.port}`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
  console.log(`📊 Health check available at: /health`);
  console.log(`🔗 Webhook endpoints:`);
  console.log(`   - /api/webhook (general)`);
  console.log(`   - /api/webhook/line (specific)`);
  console.log(`🌐 Frontend URL: https://yoake-frontend.onrender.com`);
});

export default app;