import { Request } from 'express';

// Database Models
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

export interface Survey {
  id: string;
  user_id: string;
  interest_in_side_job: string;
  side_job_time?: string;
  side_job_fields: string[];
  side_job_fields_other?: string;
  side_job_purpose?: string;
  side_job_challenge?: string;
  side_job_challenge_other?: string;
  meet_people: string[];
  service_benefit: string;
  service_benefit_other?: string;
  service_priority: string;
  created_at: string;
}

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
}

// API Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface RegisterRequest {
  idToken: string;
  surveyData: {
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
  };
}

export interface CreatePaymentIntentRequest {
  amount: number;
  email: string;
  stripeCustomerId: string;
}

export interface LinkLineAccountRequest {
  email: string;
  lineUserId: string;
}

export interface CheckInRequest {
  lineUserId: string;
  storeId: string;
}

export interface SubmitVisitSurveyRequest {
  visitId: string;
  visitType: string;
  visitPurpose: string;
  companionIndustries: string[];
  companionJobTypes: string[];
}

export interface PasswordResetRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  token: string;
  newPassword: string;
}

// LINE Types
export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LineIdTokenPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  amr?: string[];
  name?: string;
  picture?: string;
  email?: string;
}

export interface QRCodeData {
  app: string;
  type: string;
  store_id: string;
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

// Configuration Types
export interface Config {
  line: {
    loginChannelId: string;
    loginChannelSecret?: string;
    messagingApiToken: string;
    messagingChannelSecret?: string;  // Added for webhook signature validation
    liffIds: {
      register?: string;
      linking: string;
      checkin?: string;
      card?: string;
      history?: string;
    };
    richMenuId: {
      member?: string;
    };
  };
  database: {
    supabaseUrl: string;
    supabaseKey: string;
  };
  stripe: {
    secretKey: string;
    publicKey?: string;
  };
  server: {
    port: number;
    nodeEnv: string;
  };
}

// Extended Express Request with custom properties
export interface AuthenticatedRequest extends Request {
  user?: User;
  lineProfile?: LineProfile;
}

// Error Types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Rich Menu Types
export interface RichMenuArea {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  action: {
    type: string;
    label: string;
    uri: string;
  };
}

export interface RichMenuDefinition {
  size: {
    width: number;
    height: number;
  };
  selected: boolean;
  name: string;
  chatBarText: string;
  areas: RichMenuArea[];
}

// Database Query Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface VisitQueryParams extends PaginationParams {
  userId?: string;
  storeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UserQueryParams extends PaginationParams {
  email?: string;
  lineUserId?: string;
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