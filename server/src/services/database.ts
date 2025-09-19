import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { databaseConfig } from '../config';
import { 
  User, 
  UserProfile, 
  Survey, 
  Store, 
  Visit, 
  MembershipCardData,
  AppError 
} from '../types';

class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      databaseConfig.supabaseUrl,
      databaseConfig.supabaseKey
    );
  }

  // User operations
  async createUser(userData: {
    email: string;
    phone?: string;
    gender?: string;
    birth_date: string;
    line_user_id?: string;
    stripe_customer_id?: string;
  }): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating user:', error);
      throw new AppError('ユーザーの作成に失敗しました', 500);
    }

    return data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error getting user by email:', error);
      throw new AppError('ユーザー情報の取得に失敗しました', 500);
    }

    return data;
  }

  async getUserByLineId(lineUserId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('line_user_id', lineUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error getting user by LINE ID:', error);
      throw new AppError('ユーザー情報の取得に失敗しました', 500);
    }

    return data;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating user:', error);
      throw new AppError('ユーザー情報の更新に失敗しました', 500);
    }

    return data;
  }

  // Profile operations
  async createProfile(profileData: {
    user_id: string;
    industry: string;
    job_type: string;
    experience_years: string;
  }): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating profile:', error);
      throw new AppError('プロフィールの作成に失敗しました', 500);
    }

    return data;
  }

  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error getting profile:', error);
      throw new AppError('プロフィール情報の取得に失敗しました', 500);
    }

    return data;
  }

  // Survey operations
  async createSurvey(surveyData: {
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
  }): Promise<Survey> {
    const { data, error } = await this.supabase
      .from('surveys')
      .insert(surveyData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating survey:', error);
      throw new AppError('アンケートの保存に失敗しました', 500);
    }

    return data;
  }

  // Store operations
  async getStores(): Promise<Store[]> {
    const { data, error } = await this.supabase
      .from('stores')
      .select('*')
      .order('name');

    if (error) {
      console.error('Database error getting stores:', error);
      throw new AppError('店舗情報の取得に失敗しました', 500);
    }

    return data || [];
  }

  async getStoreById(storeId: string): Promise<Store | null> {
    const { data, error } = await this.supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error getting store:', error);
      throw new AppError('店舗情報の取得に失敗しました', 500);
    }

    return data;
  }

  // Visit operations
  async createVisit(visitData: {
    user_id: string;
    store_id: string;
    check_in_at?: string;
  }): Promise<Visit> {
    const { data, error } = await this.supabase
      .from('visits')
      .insert({
        ...visitData,
        check_in_at: visitData.check_in_at || new Date().toISOString(),
      })
      .select(`
        *,
        stores(name)
      `)
      .single();

    if (error) {
      console.error('Database error creating visit:', error);
      throw new AppError('チェックインの記録に失敗しました', 500);
    }

    return data;
  }

  async updateVisit(visitId: string, updates: {
    visit_type?: 'single' | 'group';
    visit_purpose?: string;
    companion_industries?: string[];
    companion_job_types?: string[];
  }): Promise<Visit> {
    const { data, error } = await this.supabase
      .from('visits')
      .update(updates)
      .eq('id', visitId)
      .select(`
        *,
        stores(name)
      `)
      .single();

    if (error) {
      console.error('Database error updating visit:', error);
      throw new AppError('来店情報の更新に失敗しました', 500);
    }

    return data;
  }

  async getVisitsByUserId(userId: string, limit = 50): Promise<Visit[]> {
    const { data, error } = await this.supabase
      .from('visits')
      .select(`
        *,
        stores(name)
      `)
      .eq('user_id', userId)
      .order('check_in_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error getting visits:', error);
      throw new AppError('来店履歴の取得に失敗しました', 500);
    }

    return data || [];
  }

  async getVisitById(visitId: string): Promise<Visit | null> {
    const { data, error } = await this.supabase
      .from('visits')
      .select(`
        *,
        stores(name)
      `)
      .eq('id', visitId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error getting visit:', error);
      throw new AppError('来店情報の取得に失敗しました', 500);
    }

    return data;
  }

  // Analytics operations
  async getMembershipCardData(lineUserId: string): Promise<MembershipCardData | null> {
    // Get user by LINE ID
    const user = await this.getUserByLineId(lineUserId);
    if (!user) {
      return null;
    }

    try {
      // Get visit statistics
      const { data: statsData, error: statsError } = await this.supabase
        .rpc('get_user_visit_stats', { user_uuid: user.id });

      if (statsError) {
        console.error('Error getting visit stats:', statsError);
        throw new AppError('統計データの取得に失敗しました', 500);
      }

      // Get visit analytics
      const { data: analyticsData, error: analyticsError } = await this.supabase
        .rpc('get_user_visit_analytics', { user_uuid: user.id });

      if (analyticsError) {
        console.error('Error getting visit analytics:', analyticsError);
        throw new AppError('分析データの取得に失敗しました', 500);
      }

      const stats = statsData || {};
      const analytics = analyticsData || {};

      return {
        profile: {
          name: 'ユーザー', // Will be updated with LINE profile
          avatarUrl: '',
        },
        charts: {
          companionIndustry: analytics.companion_industry || {},
          companionJobType: analytics.companion_job_type || {},
          visitPurpose: analytics.visit_purpose || {},
        },
        stats: {
          totalVisits: stats.total_visits || 0,
          favoriteStore: stats.favorite_store || 'なし',
          recentVisits: stats.recent_visits || [],
        },
      };
    } catch (error) {
      console.error('Error building membership card data:', error);
      throw new AppError('会員証データの構築に失敗しました', 500);
    }
  }

  // Utility operations
  async linkLineAccount(email: string, lineUserId: string): Promise<User> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404);
    }

    return await this.updateUser(user.id, { line_user_id: lineUserId });
  }

  async setPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({
        password_reset_token: token,
        password_reset_expires: expiresAt.toISOString(),
      })
      .eq('email', email);

    if (error) {
      console.error('Database error setting password reset token:', error);
      throw new AppError('パスワードリセットトークンの設定に失敗しました', 500);
    }
  }

  async verifyPasswordResetToken(token: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('password_reset_token', token)
      .gt('password_reset_expires', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error verifying reset token:', error);
      throw new AppError('トークンの検証に失敗しました', 500);
    }

    return data;
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({
        password_reset_token: null,
        password_reset_expires: null,
      })
      .eq('id', userId);

    if (error) {
      console.error('Database error clearing reset token:', error);
      throw new AppError('リセットトークンのクリアに失敗しました', 500);
    }
  }
}

export const db = new DatabaseService();
export default db;