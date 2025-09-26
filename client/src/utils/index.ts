// Date utilities
export const formatDate = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

export const formatDateTime = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

export const formatTime = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
};

export const parseQRCode = (qrData: string) => {
  try {
    if (!qrData || typeof qrData !== 'string') {
      return null;
    }
    return JSON.parse(qrData);
  } catch {
    return null;
  }
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  const cleanPhone = phone.replace(/[\s-()]/g, '');
  const phoneRegex = /^[0-9+]{10,15}$/;
  return phoneRegex.test(cleanPhone);
};

export const validateBirthDate = (birthDate: string): boolean => {
  if (!birthDate) {
    return false;
  }
  try {
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) {
      return false;
    }
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    return age >= 13 && age <= 100;
  } catch {
    return false;
  }
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
};

// Storage utilities (safe for SSR)
export const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setStorageItem = (key: string, value: string): boolean => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const removeStorageItem = (key: string): boolean => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

// LIFF utilities
export const closeLiffWindow = (): void => {
  try {
    if (typeof window !== 'undefined' && window.liff && window.liff.isInClient()) {
      window.liff.closeWindow();
    } else if (typeof window !== 'undefined') {
      // LIFF外の場合は履歴を戻る
      window.history.back();
    }
  } catch (error) {
    console.error('Failed to close LIFF window:', error);
  }
};

export const isLiffEnvironment = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.liff && window.liff.isInClient();
  } catch {
    return false;
  }
};

// API utilities
export const createApiError = (message: string, status?: number) => {
  const error = new Error(message) as any;
  error.status = status;
  return error;
};

export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw createApiError(errorData.message || `HTTP ${response.status}`, response.status);
  }
  return response.json();
};

// QR code utilities
export const parseQRData = (qrData: string) => {
  try {
    if (!qrData || typeof qrData !== 'string') {
      return null;
    }
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

// Number formatting utilities
export const formatCurrency = (amount: number): string => {
  try {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  } catch {
    return `¥${amount.toLocaleString()}`;
  }
};

export const formatNumber = (num: number): string => {
  try {
    return num.toLocaleString('ja-JP');
  } catch {
    return num.toString();
  }
};

// String utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Array utilities
export const removeDuplicates = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const groupBy = <T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

// Object utilities
export const removeEmptyFields = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== null && value !== undefined && value !== '') {
      result[key as keyof T] = value;
    }
  });
  
  return result;
};

export const deepClone = <T>(obj: T): T => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
};

// Async utilities
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) {
        throw lastError;
      }
      await sleep(delay * attempt);
    }
  }
  
  throw lastError!;
};

// Validation utilities for forms
export const validateSurveyData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.email || !validateEmail(data.email)) {
    errors.push('有効なメールアドレスを入力してください');
  }
  
  if (!data.birthDate || !validateBirthDate(data.birthDate)) {
    errors.push('有効な生年月日を入力してください');
  }
  
  if (!validateRequired(data.industry)) {
    errors.push('業界を選択してください');
  }
  
  if (!validateRequired(data.jobType)) {
    errors.push('職種を選択してください');
  }
  
  if (!validateRequired(data.experienceYears)) {
    errors.push('経験年数を選択してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Error logging utility
export const logError = (error: Error, context?: string): void => {
  console.error(`[ERROR] ${context ? `[${context}] ` : ''}${error.message}`, {
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
};

// Constants
export const API_ENDPOINTS = {
  REGISTER: '/api/register',
  LOGIN: '/api/login',
  LINK_ACCOUNT: '/api/link-line-account',
  CHECK_IN: '/api/check-in',
  MEMBERSHIP_CARD: '/api/membership-card',
  VISIT_HISTORY: '/api/visit-history',
  CREATE_PAYMENT: '/api/create-payment-intent',
  STORES: '/api/stores',
} as const;