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
        ],
        borderWidth: 2,
        borderColor: '#fff',
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
      },
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const label = context.label || '';
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${value}回 (${percentage}%)`;
        },
      },
    },
  },
};

// Date formatting utilities
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Form validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9-+().\s]+$/;
  return phoneRegex.test(phone) && phone.length >= 10;
};

export const validateBirthDate = (birthDate: string): boolean => {
  const date = new Date(birthDate);
  const now = new Date();
  const age = now.getFullYear() - date.getFullYear();
  return age >= 13 && age <= 100;
};

// Storage utilities
export const getStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage not available
  }
};

export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage not available
  }
};

// API utilities
export const createApiError = (message: string, status?: number) => {
  const error = new Error(message) as any;
  error.status = status;
  return error;
};

// QR code utilities
export const parseQRData = (qrData: string) => {
  try {
    return JSON.parse(qrData);
  } catch {
    return null;
  }
};