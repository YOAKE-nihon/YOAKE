// Chart formatting utilities
export const formatChartData = (data: Record<string, number>) => {
  const labels = Object.keys(data);
  const values = Object.values(data);
  
  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          '#FF6384',
          '#36A2EB', 
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF9F97',
          '#4BC0C8',
        ],
        borderWidth: 2,
        borderColor: '#fff',
        hoverBorderWidth: 3,
      },
    ],
  };
};

// Chart options
export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        font: {
          size: 12,
        },
        usePointStyle: true,
      },
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const label = context.label || '';
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
          return `${label}: ${value}回 (${percentage}%)`;
        },
      },
    },
  },
};

// Date formatting utilities
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '不明な日付';
    }
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '不明な日付';
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '不明な日時';
    }
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '不明な日時';
  }
};

export const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '不明な時刻';
    }
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '不明な時刻';
  }
};

// Form validation utilities
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

// Type declarations for window extensions
declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>;
      isInClient: () => boolean;
      isLoggedIn: () => boolean;
      login: () => void;
      logout: () => void;
      getProfile: () => Promise<any>;
      getIDToken: () => string;
      closeWindow: () => void;
      sendMessages: (messages: any[]) => Promise<void>;
    };
  }
}

// Chart utilities (for MembershipCardPage)
export const formatChartData = (data: Record<string, number>) => {
  const labels = Object.keys(data);
  const values = Object.values(data);
  
  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          '#FF6384',
          '#36A2EB', 
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ],
        borderWidth: 1,
      }
    ]
  };
};

export const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
  },
  maintainAspectRatio: false,
};

// Date utilities
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// QR Code parsing function (for StoreCheckinPage)
export const parseQRCode = (qrCodeData: string) => {
  try {
    if (!qrCodeData || typeof qrCodeData !== 'string') {
      return null;
    }
    
    const parsedData = JSON.parse(qrCodeData);
    
    // Validate QR code structure for YOAKE app
    if (parsedData && 
        parsedData.app === 'yoake' && 
        parsedData.type === 'check-in' && 
        parsedData.store_id) {
      return parsedData;
    }
    
    return null;
  } catch (error) {
    console.error('QR Code parsing error:', error);
    return null;
  }
};

// LIFF window utility (for LIFF apps)
export const closeLiffWindow = () => {
  try {
    if (window.liff && window.liff.isInClient()) {
      window.liff.closeWindow();
    } else {
      // Fallback for external browser
      window.close();
    }
  } catch (error) {
    console.error('Error closing LIFF window:', error);
    // Fallback
    window.close();
  }
};

// Local storage utilities (for client-side data persistence)
export const setLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting localStorage:', error);
  }
};

export const getLocalStorage = (key: string): any => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error getting localStorage:', error);
    return null;
  }
};

export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing localStorage:', error);
  }
};

// Form validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d-+().\s]+$/;
  return phoneRegex.test(phone) && phone.length >= 10;
};

export const validateRequired = (value: any): boolean => {
  return value !== null && value !== undefined && value !== '';
};

// 既存のコードはそのまま残して、以下を最後に追加

// QR Code parsing function (alias for compatibility)
export const parseQRCode = (qrCodeData: string) => {
  try {
    if (!qrCodeData || typeof qrCodeData !== 'string') {
      return null;
    }
    
    const parsedData = JSON.parse(qrCodeData);
    
    // Validate QR code structure
    if (parsedData && 
        parsedData.app === 'yoake' && 
        parsedData.type === 'check-in' && 
        parsedData.store_id) {
      return parsedData;
    }
    
    return null;
  } catch (error) {
    console.error('QR Code parsing error:', error);
    return null;
  }
};

// LIFF window utility (also missing)
export const closeLiffWindow = () => {
  try {
    if (window.liff && window.liff.isInClient()) {
      window.liff.closeWindow();
    } else {
      // Fallback for external browser
      window.close();
    }
  } catch (error) {
    console.error('Error closing LIFF window:', error);
    // Fallback
    window.close();
  }
};