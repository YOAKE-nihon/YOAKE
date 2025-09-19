// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// User Types
export interface User {
  id: string;
  email: string;
  phone?: string;
  gender?: string;
  birth_date: string;
  line_user_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  industry: string;
  job_type: string;
  experience_years: string;
  created_at: string;
  updated_at: string;
}

// Visit Types
export interface Visit {
  id: string;
  user_id: string;
  store_id: string;
  check_in_at: string;
  visit_type?: 'single' | 'group';
  visit_purpose?: string;
  companion_industries?: string[];
  companion_job_types?: string[];
  created_at: string;
  store_name?: string;
}

// Store Types
export interface Store {
  id: string;
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  qr_data: string;
  created_at: string;
}

// Chart Data Types
export interface ChartData {
  [key: string]: number;
}

export interface MembershipCardData {
  profile: {
    name: string;
    avatarUrl: string;
  };
  charts: {
    companionIndustry: ChartData;
    companionJobType: ChartData;
    visitPurpose: ChartData;
  };
  stats: {
    totalVisits: number;
    favoriteStore: string;
    recentVisits: Array<{
      date: string;
      storeName: string;
    }>;
  };
}

// Form Types
export interface RegisterFormData {
  email: string;
  phone?: string;
  gender?: string;
  birthDate: string;
  experienceYears: string;
  industry: string;
  jobType: string;
  interestInSideJob: string;
  sideJobTime?: string;
  sideJobFields: string[];
  sideJobFieldsOther?: string;
  sideJobPurpose?: string;
  sideJobChallenge?: string;
  sideJobChallengeOther?: string;
  meetPeople: string[];
  serviceBenefit: string;
  serviceBenefitOther?: string;
  servicePriority: string;
}

export interface CheckInFormData {
  visitType: string;
  visitPurpose: string;
  companionIndustries: string[];
  companionJobTypes: string[];
}

// LINE Types
export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// Payment Types
export interface PaymentIntentData {
  clientSecret: string;
  amount: number;
}

// Constants
export const GENDER_OPTIONS = ['男性', '女性', 'その他', '回答しない'] as const;
export const EXPERIENCE_YEARS_OPTIONS = ['1年未満', '1〜3年', '3〜5年', '5〜10年', '10年以上'] as const;
export const INDUSTRY_OPTIONS = [
  'IT・通信', 'メーカー', '商社', '小売・外食', '金融・保険',
  '不動産・建設', 'サービス・インフラ', '広告・メディア',
  '医療・福祉', '教育', '公務員', 'その他'
] as const;
export const JOB_TYPE_OPTIONS = [
  '経営・役員', '企画・管理', '営業・販売', 'コンサルタント',
  '専門職', 'クリエイティブ職', '技術職（IT）', '技術職（その他）',
  '事務', 'その他'
] as const;
export const VISIT_PURPOSE_OPTIONS = [
  '作業・勉強', '商談・ミーティング', '友人との歓談',
  '休憩・リラックス', 'その他'
] as const;

export type Gender = typeof GENDER_OPTIONS[number];
export type ExperienceYears = typeof EXPERIENCE_YEARS_OPTIONS[number];
export type Industry = typeof INDUSTRY_OPTIONS[number];
export type JobType = typeof JOB_TYPE_OPTIONS[number];
export type VisitPurpose = typeof VISIT_PURPOSE_OPTIONS[number];