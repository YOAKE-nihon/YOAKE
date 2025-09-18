import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { 
  ValidationResult, 
  ValidationError, 
  RegisterRequest, 
  LineIdTokenPayload,
  AppError 
} from '../types';

/**
 * Create a standardized API response
 */
export function createApiResponse<T = any>(
  success: boolean, 
  data?: T, 
  message?: string
) {
  return {
    success,
    ...(data && { data }),
    ...(message && { message }),
  };
}

/**
 * Create a success response
 */
export function createSuccessResponse<T = any>(data?: T, message?: string) {
  return createApiResponse(true, data, message);
}

/**
 * Create an error response
 */
export function createErrorResponse(message: string, data?: any) {
  return createApiResponse(false, data, message);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (Japanese format)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\-\(\)\+\s]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
}

/**
 * Validate birth date (must be at least 13 years old)
 */
export function validateBirthDate(birthDate: string): boolean {
  const date = new Date(birthDate);
  const now = new Date();
  const minAge = new Date();
  minAge.setFullYear(now.getFullYear() - 13);
  
  return date < minAge && date > new Date('1900-01-01');
}

/**
 * Validate registration request data
 */
export function validateRegistrationData(data: RegisterRequest['surveyData']): ValidationResult {
  const errors: ValidationError[] = [];

  // Required field validations
  if (!data.email || !validateEmail(data.email)) {
    errors.push({ field: 'email', message: '有効なメールアドレスを入力してください' });
  }

  if (!data.birthDate || !validateBirthDate(data.birthDate)) {
    errors.push({ field: 'birthDate', message: '有効な生年月日を入力してください（13歳以上）' });
  }

  if (!data.industry) {
    errors.push({ field: 'industry', message: '業界を選択してください' });
  }

  if (!data.jobType) {
    errors.push({ field: 'jobType', message: '職種を選択してください' });
  }

  if (!data.experienceYears) {
    errors.push({ field: 'experienceYears', message: '経験年数を選択してください' });
  }

  if (!data.interestInSideJob) {
    errors.push({ field: 'interestInSideJob', message: '副業への関心を選択してください' });
  }

  if (!data.serviceBenefit) {
    errors.push({ field: 'serviceBenefit', message: '楽しみな特典を選択してください' });
  }

  if (!data.servicePriority) {
    errors.push({ field: 'servicePriority', message: '重視することを選択してください' });
  }

  // Conditional validations for side job questions
  const showSideJobQuestions = ['high', 'medium'].includes(data.interestInSideJob);
  if (showSideJobQuestions) {
    if (!data.sideJobTime) {
      errors.push({ field: 'sideJobTime', message: '副業に割ける時間を選択してください' });
    }
    if (!data.sideJobPurpose) {
      errors.push({ field: 'sideJobPurpose', message: '副業の目的を選択してください' });
    }
    if (!data.sideJobChallenge) {
      errors.push({ field: 'sideJobChallenge', message: '副業への課題を選択してください' });
    }
  }

  // Optional field validations
  if (data.phone && !validatePhone(data.phone)) {
    errors.push({ field: 'phone', message: '有効な電話番号を入力してください' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Hash a password using crypto
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against its hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  if (!salt || !hash) return false;
  
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * Parse and validate LINE ID token
 */
export function parseLineIdToken(idToken: string): LineIdTokenPayload {
  try {
    // Note: In production, you should verify the token signature
    // For now, we'll decode without verification
    const decoded = jwt.decode(idToken) as LineIdTokenPayload;
    
    if (!decoded || !decoded.sub) {
      throw new AppError('Invalid ID token', 400);
    }

    return decoded;
  } catch (error) {
    throw new AppError('Failed to parse ID token', 400);
  }
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format date to Japanese locale string
 */
export function formatDateJP(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP');
}

/**
 * Format datetime to Japanese locale string
 */
export function formatDateTimeJP(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('ja-JP');
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Check if string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim();
}

/**
 * Create QR code data for store check-in
 */
export function createQRCodeData(storeId: string): string {
  return JSON.stringify({
    app: 'yoake',
    type: 'check-in',
    store_id: storeId,
  });
}

/**
 * Parse QR code data
 */
export function parseQRCodeData(qrValue: string): { app: string; type: string; store_id: string } | null {
  try {
    const parsed = JSON.parse(qrValue);
    if (parsed.app === 'yoake' && parsed.type === 'check-in' && parsed.store_id) {
      return parsed;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Exponential backoff
      await sleep(delay * Math.pow(2, attempt - 1));
    }
  }
  
  throw lastError!;
}

/**
 * Group array of objects by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Count occurrences in array
 */
export function countBy<T>(array: T[], key: keyof T): Record<string, number> {
  return array.reduce((counts, item) => {
    const group = String(item[key]);
    counts[group] = (counts[group] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}