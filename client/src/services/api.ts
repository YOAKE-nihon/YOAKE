import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  SurveyData, 
  MembershipCardData, 
  Visit 
} from '../types';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-api.com/api' 
    : '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error?.response?.data || error.message);
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      console.warn('Unauthorized access detected');
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error detected');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authApi = {
  register: async (data: { 
    idToken: string; 
    surveyData: SurveyData; 
  }): Promise<ApiResponse<{ stripeCustomerId: string }>> => {
    const response = await api.post('/register', data);
    return response.data;
  },

  linkLineAccount: async (data: { 
    email: string; 
    lineUserId: string; 
  }): Promise<ApiResponse> => {
    const response = await api.post('/link-line-account', data);
    return response.data;
  },

  requestPasswordReset: async (data: { 
    email: string; 
  }): Promise<ApiResponse> => {
    const response = await api.post('/request-password-reset', data);
    return response.data;
  },

  updatePassword: async (data: { 
    token: string; 
    newPassword: string; 
  }): Promise<ApiResponse> => {
    const response = await api.post('/update-password', data);
    return response.data;
  },
};

export const paymentApi = {
  createPaymentIntent: async (data: {
    amount: number;
    email: string;
    stripeCustomerId: string;
  }): Promise<ApiResponse<{ clientSecret: string }>> => {
    const response = await api.post('/create-payment-intent', data);
    return response.data;
  },
};

export const userApi = {
  checkIn: async (data: {
    lineUserId: string;
    storeId: string;
  }): Promise<ApiResponse<{ visitId: string }>> => {
    const response = await api.post('/check-in', data);
    return response.data;
  },

  submitVisitSurvey: async (data: {
    visitId: string;
    visitType: string;
    visitPurpose: string;
    companionIndustries: string[];
    companionJobTypes: string[];
  }): Promise<ApiResponse> => {
    const response = await api.post('/submit-visit-survey', data);
    return response.data;
  },

  getMembershipCard: async (params: {
    lineUserId: string;
  }): Promise<ApiResponse<MembershipCardData>> => {
    const response = await api.get('/membership-card', { params });
    return response.data;
  },

  getVisitHistory: async (params: {
    lineUserId: string;
  }): Promise<ApiResponse<Visit[]>> => {
    const response = await api.get('/visit-history', { params });
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<ApiResponse> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'エラーが発生しました。しばらく時間をおいて再度お試しください。';
};

export default api;