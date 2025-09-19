import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { db } from '../services/database';
import { lineService } from '../services/line';
import { config } from '../config';
import { AuthenticatedRequest, AppError } from '../types';
import { createErrorResponse, logError } from '../utils';

// Security middleware
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.line.me", "https://api.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Rate limiting middleware
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for sensitive endpoints
export const strictRateLimitMiddleware = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per hour
  message: {
    error: 'Too many attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS middleware
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://liff.line.me',
      'https://liff-gateway.lineml.jp',
      'https://liff.line-beta.me',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    
    if (config.server.nodeEnv === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-line-signature'],
};

// Authentication middleware for LINE ID token
export const authenticateLineToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(createErrorResponse('認証トークンが必要です'));
    }
    
    const idToken = authHeader.substring(7);
    
    // Verify LINE ID token
    const lineProfile = await lineService.verifyIdToken(idToken);
    if (!lineProfile) {
      return res.status(401).json(createErrorResponse('無効な認証トークンです'));
    }
    
    // Get user from database
    const user = await db.getUserByLineId(lineProfile.sub);
    if (!user) {
      return res.status(404).json(createErrorResponse('ユーザーが見つかりません'));
    }
    
    req.user = user;
    req.lineProfile = lineProfile;
    next();
  } catch (error) {
    logError(error as Error, 'authenticateLineToken');
    return res.status(401).json(createErrorResponse('認証に失敗しました'));
  }
};

// Optional authentication middleware
export const optionalAuthentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.substring(7);
      
      try {
        const lineProfile = await lineService.verifyIdToken(idToken);
        if (lineProfile) {
          const user = await db.getUserByLineId(lineProfile.sub);
          if (user) {
            req.user = user;
            req.lineProfile = lineProfile;
          }
        }
      } catch (error) {
        // Ignore authentication errors in optional mode
        logError(error as Error, 'optionalAuthentication');
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Admin authentication middleware
export const authenticateAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(createErrorResponse('管理者認証が必要です'));
    }
    
    const token = authHeader.substring(7);
    
    // Verify JWT token for admin
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    if (!decoded.isAdmin) {
      return res.status(403).json(createErrorResponse('管理者権限が必要です'));
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    logError(error as Error, 'authenticateAdmin');
    return res.status(401).json(createErrorResponse('管理者認証に失敗しました'));
  }
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    
    console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} - ${statusCode} (${duration}ms)`);
  });
  
  next();
};

// Error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logError(error, 'errorHandler');
  
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(createErrorResponse(error.message));
  }
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json(createErrorResponse('入力データが無効です'));
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json(createErrorResponse('無効なIDです'));
  }
  
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    return res.status(409).json(createErrorResponse('データが既に存在します'));
  }
  
  // Default error response
  const statusCode = config.server.nodeEnv === 'production' ? 500 : 500;
  const message = config.server.nodeEnv === 'production' 
    ? 'サーバーエラーが発生しました' 
    : error.message;
  
  res.status(statusCode).json(createErrorResponse(message));
};

// Validation middleware factory
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map((detail: any) => detail.message).join(', ');
      res.status(400).json(createErrorResponse(errorMessage));
      return;
    }
    
    req.body = value;
    next();
  };
};

// Content type validation middleware
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      res.status(400).json(createErrorResponse('無効なContent-Type'));
      return;
    }
    
    next();
  };
};

// LINE webhook signature validation middleware
export const validateLineSignature = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const signature = req.headers['x-line-signature'] as string;
    const body = req.body;
    
    if (!signature) {
      res.status(400).json(createErrorResponse('署名が必要です'));
      return;
    }
    
    const isValid = lineService.validateSignature(body.toString(), signature);
    
    if (!isValid) {
      res.status(401).json(createErrorResponse('無効な署名です'));
      return;
    }
    
    next();
  } catch (error) {
    logError(error as Error, 'validateLineSignature');
    res.status(400).json(createErrorResponse('署名の検証に失敗しました'));
  }
};

// Async error wrapper
export const asyncWrapper = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Health check middleware
export const healthCheck = (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
  });
};