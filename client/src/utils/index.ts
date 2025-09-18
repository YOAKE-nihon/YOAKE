import { SurveyData, FormValidation, ErrorState } from '../types';

// Date utilities
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP');
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('ja-JP');
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('ja-JP');
};

// Form validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\-\(\)\+\s]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
};

export const validateBirthDate = (birthDate: string): boolean => {
  const date = new Date(birthDate);
  const now = new Date();
  const minAge = new Date();
  minAge.setFullYear(now.getFullYear() - 13); // 最低13歳
  
  return date < minAge && date > new Date('1900-01-01');
};

export const validateSurveyData = (data: Partial<SurveyData>): FormValidation => {
  const errors: Record<string, string> = {};

  // Required fields validation
  if (!data.email || !validateEmail(data.email)) {
    errors.email = '有効なメールアドレスを入力してください';
  }

  if (!data.birthDate || !validateBirthDate(data.birthDate)) {
    errors.birthDate = '有効な生年月日を入力してください';
  }

  if (!data.industry) {
    errors.industry = '業界を選択してください';
  }

  if (!data.jobType) {
    errors.jobType = '職種を選択してください';
  }

  if (!data.experienceYears) {
    errors.experienceYears = '経験年数を選択してください';
  }

  if (!data.interestInSideJob) {
    errors.interestInSideJob = '副業への関心を選択してください';
  }

  if (!data.serviceBenefit) {
    errors.serviceBenefit = '楽しみな特典を選択してください';
  }

  if (!data.servicePriority) {
    errors.servicePriority = '重視することを選択してください';
  }

  // Conditional validation for side job questions
  const showSideJobQuestions = ['high', 'medium'].includes(data.interestInSideJob || '');
  if (showSideJobQuestions) {
    if (!data.sideJobTime) {
      errors.sideJobTime = '副業に割ける時間を選択してください';
    }
    if (!data.sideJobPurpose) {
      errors.sideJobPurpose = '副業の目的を選択してください';
    }
    if (!data.sideJobChallenge) {
      errors.sideJobChallenge = '副業への課題を選択してください';
    }
  }

  // Phone validation (optional)
  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = '有効な電話番号を入力してください';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// LIFF utilities
export const initializeLiff = async (liffId: string): Promise<boolean> => {
  try {
    const liff = window.liff;
    if (!liff) {
      throw new Error('LIFF SDKが見つかりません');
    }

    await liff.init({ liffId });
    return true;
  } catch (error) {
    console.error('LIFF initialization error:', error);
    return false;
  }
};

export const getLiffProfile = async () => {
  try {
    const liff = window.liff;
    if (!liff || !liff.isLoggedIn()) {
      throw new Error('LIFF not logged in');
    }

    return await liff.getProfile();
  } catch (error) {
    console.error('Get LIFF profile error:', error);
    throw error;
  }
};

export const getLiffIdToken = (): string | null => {
  try {
    const liff = window.liff;
    if (!liff || !liff.isLoggedIn()) {
      return null;
    }

    return liff.getIDToken();
  } catch (error) {
    console.error('Get LIFF ID token error:', error);
    return null;
  }
};

export const redirectToLiffLogin = (redirectUri?: string): void => {
  try {
    const liff = window.liff;
    if (!liff) {
      throw new Error('LIFF SDKが見つかりません');
    }

    liff.login({ redirectUri: redirectUri || window.location.href });
  } catch (error) {
    console.error('LIFF login redirect error:', error);
  }
};

export const closeLiffWindow = (): void => {
  try {
    const liff = window.liff;
    if (liff && liff.isInClient()) {
      liff.closeWindow();
    }
  } catch (error) {
    console.error('Close LIFF window error:', error);
  }
};

// Error handling utilities
export const createErrorState = (message: string, field?: string): ErrorState => {
  return { message, field };
};

export const formatErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'エラーが発生しました';
};

// Chart utilities for membership card
export const formatChartData = (chartData: Record<string, number>, label: string) => {
  const labels = Object.keys(chartData);
  const data = Object.values(chartData);
  
  return {
    labels,
    datasets: [{
      label,
      data,
      backgroundColor: [
        'rgba(184, 117, 0, 0.7)',
        'rgba(108, 117, 125, 0.7)',
        'rgba(214, 164, 73, 0.7)',
        'rgba(248, 249, 250, 0.7)',
        'rgba(52, 58, 64, 0.7)',
        'rgba(255, 193, 7, 0.7)'
      ],
      borderColor: [
        '#b87500',
        '#6c757d',
        '#d6a449',
        '#f8f9fa',
        '#343a40',
        '#ffc107'
      ],
      borderWidth: 1,
    }]
  };
};

export const chartOptions = {
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: '#333',
        font: { size: 10 }
      }
    }
  },
  maintainAspectRatio: false,
  responsive: true
};

// Local storage utilities (fallback for non-supported environments)
export const setLocalStorage = (key: string, value: any): void => {
  try {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.warn('LocalStorage not available:', error);
  }
};

export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    if (typeof Storage !== 'undefined') {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    }
  } catch (error) {
    console.warn('LocalStorage not available:', error);
  }
  return defaultValue;
};

export const removeLocalStorage = (key: string): void => {
  try {
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('LocalStorage not available:', error);
  }
};

// QR Code utilities
export const parseQRCode = (qrValue: string): { app: string; type: string; store_id: string } | null => {
  try {
    const parsed = JSON.parse(qrValue);
    if (parsed.app === 'yoake' && parsed.type === 'check-in' && parsed.store_id) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('QR code parse error:', error);
    return null;
  }
};

// Debounce utility for form inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};