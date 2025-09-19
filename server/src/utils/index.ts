import crypto from 'crypto';
import { ApiResponse, ValidationError, ValidationResult } from '../types';

// Response utilities
export const createSuccessResponse = <T>(data?: T, message?: string): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
  };
};

export const createErrorResponse = (message: string): ApiResponse => {
  return {
    success: false,
    message,
  };
};

// Validation utilities
export const validateEmail = (email: string): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (!email) {
    errors.push({ field: 'email', message: 'メールアドレスは必須です' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ field: 'email', message: '有効なメールアドレスを入力してください' });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validatePhone = (phone?: string): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (phone) {
    const phoneRegex = /^[0-9-+().\s]+$/;
    if (!phoneRegex.test(phone) || phone.length < 10) {
      errors.push({ field: 'phone', message: '有効な電話番号を入力してください' });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateBirthDate = (birthDate: string): ValidationResult => {
  const errors: ValidationError[] = [];
  
  if (!birthDate) {
    errors.push({ field: 'birthDate', message: '生年月日は必須です' });
  } else {
    const date = new Date(birthDate);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    
    if (isNaN(date.getTime())) {
      errors.push({ field: 'birthDate', message: '有効な日付を入力してください' });
    } else if (age < 13 || age > 100) {
      errors.push({ field: 'birthDate', message: '年齢は13歳以上100歳以下である必要があります' });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateRequiredFields = (data: Record<string, any>, requiredFields: string[]): ValidationResult => {
  const errors: ValidationError[] = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push({ 
        field, 
        message: `${field}は必須です` 
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Security utilities
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const hashPassword = (password: string, salt?: string): string => {
  if (!password) {
    throw new Error('Password is required');
  }
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512');
  return `${actualSalt}:${hash.toString('hex')}`;
};

export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  if (!password || !hashedPassword) {
    return false;
  }
  const parts = hashedPassword.split(':');
  if (parts.length !== 2) {
    return false;
  }
  const [salt, hash] = parts;
  if (!salt || !hash) {
    return false;
  }
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
  return hash === verifyHash.toString('hex');
};

// Date utilities
export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setTime(result.getTime() + (hours * 60 * 60 * 1000));
  return result;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatDateForDatabase = (date: Date): string => {
  return date.toISOString();
};

// Array utilities
export const removeDuplicates = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const isArrayEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

// Object utilities
export const removeUndefinedFields = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      result[key as keyof T] = obj[key];
    }
  });
  
  return result;
};

export const sanitizeObject = <T extends Record<string, any>>(obj: T, allowedFields: string[]): Partial<T> => {
  const result: Partial<T> = {};
  
  allowedFields.forEach(field => {
    if (obj[field] !== undefined) {
      result[field as keyof T] = obj[field];
    }
  });
  
  return result;
};

// Error utilities
export const logError = (error: Error, context?: string): void => {
  console.error(`[ERROR] ${context ? `[${context}] ` : ''}${error.message}`, {
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
};

export const safeAsyncWrapper = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error as Error, fn.name);
      return null;
    }
  };
};

// QR Code utilities
export const parseQRData = (qrData: string): any => {
  try {
    return JSON.parse(qrData);
  } catch {
    return null;
  }
};

export const validateQRData = (qrData: any): boolean => {
  return (
    qrData &&
    typeof qrData === 'object' &&
    qrData.app === 'yoake' &&
    qrData.type === 'check-in' &&
    qrData.store_id
  );
};

// Utility functions for compatibility
export const parseQRCodeData = parseQRData; // Alias for compatibility

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

export const validateRegistrationData = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];
  const requiredFields = ['email', 'birthDate', 'industry', 'jobType', 'experienceYears'];
  
  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push({ field, message: `${field}は必須です` });
    }
  });
  
  if (data.email) {
    const emailValidation = validateEmail(data.email);
    errors.push(...emailValidation.errors);
  }
  
  if (data.birthDate) {
    const birthDateValidation = validateBirthDate(data.birthDate);
    errors.push(...birthDateValidation.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const parseLineIdToken = (idToken: string): any => {
  try {
    if (!idToken || typeof idToken !== 'string') {
      return null;
    }
    
    const parts = idToken.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }
    
    const payload = Buffer.from(parts[1], 'base64url').toString();
    return JSON.parse(payload);
  } catch {
    return null;
  }
};