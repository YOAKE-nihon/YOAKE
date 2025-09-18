import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AppError, AuthenticatedRequest } from '../types';
import { createErrorResponse, parseLineIdToken } from '../utils';
import { db } from '../services/database';
import { lineService } from '../services/line';
import { rateLimitConfig, isDevelopment } from '../config';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`Error in ${req.method} ${req.path}:`, error);

  // Handle known AppError instances
  if (error instanceof AppError) {
    res.status(error.statusCode).json(
      createErrorResponse(error.message)
    );
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json(
      createErrorResponse('入力データが正しくありません', error.message)
    );
    return;
  }

  // Handle database errors
  if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
    res.status(409).json(
      createErrorResponse('データが既に存在します')
    );
    return;
  }

  // Handle unauthorized errors
  if (error.message?.includes('unauthorized') || error.message?.includes('forbidden')) {
    res.status(401).json(
      createErrorResponse('認証が必要です')
    );
    return;
  }

  // Default server error
  res.status(500).json(
    createErrorResponse(
      isDevelopment 
        ? `サーバーエラー: ${error.message}`
        : 'サーバー内部でエラーが発生しました'
    )
  );
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  if (isDevelopment && req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

/**
 * Rate limiting middleware
 */
export const rateLimiter = rateLimit(rateLimitConfig);

/**
 * API-specific rate limiter (more restrictive)
 */
export const apiRateLimiter = rateLimit({
  ...rateLimitConfig,
  max: isDevelopment ? 1000 : 50, // Lower limit for API endpoints
  message: createErrorResponse('APIリクエストが多すぎます。しばらく待ってからお試しください。'),
});

/**
 * Authentication middleware for LINE users
 */
export const authenticateLineUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!idToken) {
      res.status(401).json(
        createErrorResponse('認証トークンが必要です')
      );
      return;
    }

    // Parse LINE ID token
    const lineProfile = parseLineIdToken(idToken);
    
    // Get user from database
    const user = await db.getUserByLineId(lineProfile.sub);
    if (!user) {
      res.status(401).json(
        createErrorResponse('ユーザーが見つかりません。アカウント連携を完了してください。')
      );
      return;
    }

    // Add user and LINE profile to request
    req.user = user;
    req.lineProfile = {
      userId: lineProfile.sub,
      displayName: lineProfile.name || 'Unknown User',
      pictureUrl: lineProfile.picture,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json(
      createErrorResponse('認証に失敗しました')
    );
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuthentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (idToken) {
      const lineProfile = parseLineIdToken(idToken);
      const user = await db.getUserByLineId(lineProfile.sub);
      
      if (user) {
        req.user = user;
        req.lineProfile = {
          userId: lineProfile.sub,
          displayName: lineProfile.name || 'Unknown User',
          pictureUrl: lineProfile.picture,
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail for optional authentication
    console.warn('Optional authentication failed:', error);
    next();
  }
};

/**
 * Validate request body middleware
 */
export const validateRequestBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      res.status(400).json(
        createErrorResponse(
          `必須フィールドが不足しています: ${missingFields.join(', ')}`
        )
      );
      return;
    }

    next();
  };
};

/**
 * Validate query parameters middleware
 */
export const validateQueryParams = (requiredParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingParams = requiredParams.filter(param => {
      const value = req.query[param];
      return value === undefined || value === null || value === '';
    });

    if (missingParams.length > 0) {
      res.status(400).json(
        createErrorResponse(
          `必須パラメータが不足しています: ${missingParams.join(', ')}`
        )
      );
      return;
    }

    next();
  };
};

/**
 * CORS preflight handler
 */
export const corsPreflightHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  } else {
    next();
  }
};

/**
 * Health check endpoint middleware
 */
export const healthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.path === '/health' || req.path === '/api/health') {
    try {
      // Check database connectivity
      const dbHealthy = await db.healthCheck();
      
      const health = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: dbHealthy ? 'connected' : 'disconnected',
        uptime: process.uptime(),
      };

      res.status(dbHealthy ? 200 : 503).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
    return;
  }

  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CSP for API endpoints
  if (req.path.startsWith('/api/')) {
    res.header('Content-Security-Policy', "default-src 'none'");
  }

  next();
};

/**
 * JSON parsing error handler
 */
export const jsonErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof SyntaxError && 'body' in error && (error as any).type === 'entity.parse.failed') {
    res.status(400).json(
      createErrorResponse('JSONの形式が正しくありません')
    );
    return;
  }

  next(error);
};

/**
 * Request timeout middleware
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json(
          createErrorResponse('リクエストがタイムアウトしました')
        );
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Development middleware (only in development mode)
 */
export const developmentMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (isDevelopment) {
    // Log all headers in development
    console.log('Request headers:', req.headers);
    
    // Add development-specific headers
    res.header('X-Development-Mode', 'true');
  }

  next();
};