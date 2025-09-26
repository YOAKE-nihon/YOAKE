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

// Alias for compatibility
export interface SurveyData extends RegisterFormData {}

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

// Survey-related constants
export const SIDE_JOB_INTEREST_OPTIONS = [
  'とても興味がある', '少し興味がある', 'あまり興味がない', '全く興味がない'
] as const;

export const SIDE_JOB_TIME_OPTIONS = [
  '平日夜', '土日祝日', '平日昼間', 'いつでも', '時間が取れない'
] as const;

export const SIDE_JOB_FIELDS_OPTIONS = [
  'Webデザイン・制作', 'プログラミング', 'ライティング', 'マーケティング',
  'コンサルティング', '教育・研修', '翻訳・通訳', 'データ分析',
  '写真・動画制作', 'その他'
] as const;

export const SIDE_JOB_PURPOSE_OPTIONS = [
  '収入を増やしたい', 'スキルアップしたい', '人脈を広げたい', 
  '新しいことに挑戦したい', '将来の独立準備', 'その他'
] as const;

export const SIDE_JOB_CHALLENGE_OPTIONS = [
  '時間がない', 'スキル不足', '案件の見つけ方がわからない',
  '価格設定がわからない', '継続的な案件獲得', 'その他'
] as const;

export const MEET_PEOPLE_OPTIONS = [
  '同業界の人', '異業界の人', '起業家・経営者', 'フリーランス',
  '学生', '投資家', 'クリエイター', 'その他'
] as const;

export const SERVICE_BENEFIT_OPTIONS = [
  'ネットワーキング', '作業環境', '学習機会', 'イベント参加',
  'メンタリング', 'ビジネスマッチング', '情報交換', 'その他'
] as const;

export const SERVICE_PRIORITY_OPTIONS = [
  '立地・アクセス', '料金', 'コミュニティ', '設備・環境',
  'イベント・勉強会', 'サポート体制', '営業時間', 'その他'
] as const;

export type Gender = typeof GENDER_OPTIONS[number];
export type ExperienceYears = typeof EXPERIENCE_YEARS_OPTIONS[number];
export type Industry = typeof INDUSTRY_OPTIONS[number];
export type JobType = typeof JOB_TYPE_OPTIONS[number];
export type VisitPurpose = typeof VISIT_PURPOSE_OPTIONS[number];
export type SideJobInterest = typeof SIDE_JOB_INTEREST_OPTIONS[number];
export type SideJobTime = typeof SIDE_JOB_TIME_OPTIONS[number];
export type SideJobField = typeof SIDE_JOB_FIELDS_OPTIONS[number];
export type SideJobPurpose = typeof SIDE_JOB_PURPOSE_OPTIONS[number];
export type SideJobChallenge = typeof SIDE_JOB_CHALLENGE_OPTIONS[number];
export type MeetPeople = typeof MEET_PEOPLE_OPTIONS[number];
export type ServiceBenefit = typeof SERVICE_BENEFIT_OPTIONS[number];
export type ServicePriority = typeof SERVICE_PRIORITY_OPTIONS[number];

// QR Code data structure
export interface QRCodeData {
  app: string;
  type: string;
  store_id: string;
  timestamp?: number;
}