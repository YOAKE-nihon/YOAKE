// Global type definitions

declare global {
    interface Window {
      liff: any;
    }
  }
  
  export interface LiffProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  }
  
  export interface User {
    id: string;
    email: string;
    phone?: string;
    gender?: string;
    birthDate: string;
    lineUserId?: string;
    stripeCustomerId?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface SurveyData {
    // Basic info
    email: string;
    phone?: string;
    gender?: string;
    birthDate: string;
    
    // Profile
    experienceYears: string;
    industry: string;
    jobType: string;
    
    // Community interests
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
  
  export interface Store {
    id: string;
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }
  
  export interface Visit {
    id: string;
    userId: string;
    storeId: string;
    storeName: string;
    checkInAt: string;
    visitType?: 'single' | 'group';
    visitPurpose?: string;
    companionIndustries?: string[];
    companionJobTypes?: string[];
  }
  
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
  
  export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
  }
  
  export interface ErrorState {
    message: string;
    field?: string;
  }
  
  export interface FormValidation {
    isValid: boolean;
    errors: Record<string, string>;
  }
  
  // Form constants
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
  export const SIDE_JOB_INTEREST_OPTIONS = [
    { value: 'high', label: '強い関心がある' },
    { value: 'medium', label: '興味はあるがまだ踏み出せていない' },
    { value: 'low', label: 'あまり興味はないが、必要性を感じている' },
    { value: 'none', label: '副業には全く関心がない' }
  ] as const;
  export const SIDE_JOB_TIME_OPTIONS = ['10時間未満', '10〜20時間', '20〜30時間', '30時間以上'] as const;
  export const SIDE_JOB_FIELDS_OPTIONS = [
    'マーケティング', 'デザイン', 'ライティング', 'IT・プログラミング', 
    'ビジネス・コンサルティング', 'その他'
  ] as const;
  export const SIDE_JOB_PURPOSE_OPTIONS = [
    '副収入を得るため', 'スキルやキャリアを成長させるため', 
    '新しい人脈を作るため', '自分らしいライフスタイルを作るため', 
    '社会貢献を目指すため'
  ] as const;
  export const SIDE_JOB_CHALLENGE_OPTIONS = [
    '時間管理', '資金調達', '経験不足', '人脈不足', 
    'スキルや知識の不足', 'その他'
  ] as const;
  export const MEET_PEOPLE_OPTIONS = [
    '同じ業界の専門家', '副業をしている人', '起業家や経営者', 
    '自己成長を目指している人', '他業種の人と広くつながりたい'
  ] as const;
  export const SERVICE_BENEFIT_OPTIONS = [
    '無料のドリンク', '新しいビジネスパートナーとの出会い', 
    '情報交換', '講座やセミナー', 'その他'
  ] as const;
  export const SERVICE_PRIORITY_OPTIONS = [
    'コストパフォーマンス', '他の会員との交流機会', 
    '安定した挑戦環境', '知識やスキルの向上', 
    'サポートしてくれるコミュニティ'
  ] as const;
  export const VISIT_PURPOSE_OPTIONS = [
    '作業・勉強', '商談・ミーティング', '友人との歓談', 
    '休憩・リラックス', 'その他'
  ] as const;
  
  export type Gender = typeof GENDER_OPTIONS[number];
  export type ExperienceYears = typeof EXPERIENCE_YEARS_OPTIONS[number];
  export type Industry = typeof INDUSTRY_OPTIONS[number];
  export type JobType = typeof JOB_TYPE_OPTIONS[number];
  export type SideJobInterest = typeof SIDE_JOB_INTEREST_OPTIONS[number]['value'];
  export type SideJobTime = typeof SIDE_JOB_TIME_OPTIONS[number];
  export type SideJobField = typeof SIDE_JOB_FIELDS_OPTIONS[number];
  export type SideJobPurpose = typeof SIDE_JOB_PURPOSE_OPTIONS[number];
  export type SideJobChallenge = typeof SIDE_JOB_CHALLENGE_OPTIONS[number];
  export type MeetPeople = typeof MEET_PEOPLE_OPTIONS[number];
  export type ServiceBenefit = typeof SERVICE_BENEFIT_OPTIONS[number];
  export type ServicePriority = typeof SERVICE_PRIORITY_OPTIONS[number];
  export type VisitPurpose = typeof VISIT_PURPOSE_OPTIONS[number];