import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, corsOptions, isDevelopment, isProduction } from './config';

// Middleware imports
import {
  errorHandler,
  requestLogger,
  rateLimiter,
  apiRateLimiter,
  corsPreflightHandler,
  healthCheck,
  securityHeaders,
  jsonErrorHandler,
  requestTimeout,
  developmentMiddleware,
} from './middleware';

// Route imports
import authRoutes from './routes/auth';
import paymentRoutes from './routes/payment';
import userRoutes from './routes/user';

const app = express();

// Trust proxy (important for rate limiting and getting real IPs)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for LIFF compatibility
  crossOriginEmbedderPolicy: false, // Disable COEP for LIFF compatibility
}));

// CORS configuration
app.use(cors(corsOptions));
app.use(corsPreflightHandler);

// Security headers
app.use(securityHeaders);

// Request timeout (30 seconds)
app.use(requestTimeout(30000));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification
    if (req.path === '/api/webhook/stripe') {
      (req as any).rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON parsing error handler
app.use(jsonErrorHandler);

// Development middleware
if (isDevelopment) {
  app.use(developmentMiddleware);
}

// Request logging
app.use(requestLogger);

// Health check (before rate limiting)
app.use(healthCheck);

// Rate limiting
app.use(rateLimiter);
app.use('/api/', apiRateLimiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'YOAKE Server is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    status: 'healthy',
  });
});

// API routes
app.use('/api', authRoutes);
app.use('/api', paymentRoutes);
app.use('/api', userRoutes);

// Basic API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    requestId: Math.random().toString(36).substr(2, 9),
  });
});

// LINE webhook endpoint (special handling for raw body)
app.post('/api/webhook/line', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-line-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Validate signature
    const body = req.body.toString();
    const isValid = require('./services/line').lineService.validateSignature(body, signature);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse events
    const events = JSON.parse(body).events;
    
    // Process each event
    for (const event of events) {
      await require('./services/line').lineService.handleWebhookEvent(event);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('LINE webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `エンドポイント ${req.method} ${req.originalUrl} が見つかりません`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received, starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connections, cleanup, etc.
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
  console.log(`📍 Port: ${config.server.port}`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  if (isDevelopment) {
    console.log(`🔗 Local URL: http://localhost:${config.server.port}`);
    console.log(`🔗 API URL: http://localhost:${config.server.port}/api`);
    console.log(`💡 Health Check: http://localhost:${config.server.port}/health`);
  }
  
  if (isProduction) {
    console.log('🔒 Production mode - Security enhanced');
  }
});

export default app;