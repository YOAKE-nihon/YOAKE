import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  User, 
  UserProfile, 
  Survey, 
  Store, 
  Visit, 
  UserQueryParams, 
  VisitQueryParams,
  ChartData,
  MembershipCardData,
  AppError 
} from '../types';
import { databaseConfig } from '../config';
import { getCurrentTimestamp, generateUUID, countBy } from '../utils';

class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      databaseConfig.supabaseUrl,
      databaseConfig.supabaseKey
    );
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const now = getCurrentTimestamp();
    const user: User = {
      id: generateUUID(),
      ...userData,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create user: ${error.message}`, 500);
    }

    return data;
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new AppError(`Failed to get user: ${error.message}`, 500);
    }

    return data || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AppError(`Failed to get user by email: ${error.message}`, 500);
    }

    return data || null;
  }

  async getUserByLineId(lineUserId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('line_user_id', lineUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AppError(`Failed to get user by LINE ID: ${error.message}`, 500);
    }

    return data || null;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User> {
    const now = getCurrentTimestamp();
    const updateData = {
      ...updates,
      updated_at: now,
    };

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update user: ${error.message}`, 500);
    }

    return data;
  }

  async linkLineAccount(email: string, lineUserId: string): Promise<User> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404);
    }

    return this.updateUser(user.id, { line_user_id: lineUserId });
  }

  // User profile operations
  async createUserProfile(profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    const now = getCurrentTimestamp();
    const profile: UserProfile = {
      id: generateUUID(),
      ...profileData,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert([profile])
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create user profile: ${error.message}`, 500);
    }

    return data;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AppError(`Failed to get user profile: ${error.message}`, 500);
    }

    return data || null;
  }

  // Survey operations
  async createSurvey(surveyData: Omit<Survey, 'id' | 'created_at'>): Promise<Survey> {
    const survey: Survey = {
      id: generateUUID(),
      ...surveyData,
      created_at: getCurrentTimestamp(),
    };

    const { data, error } = await this.supabase
      .from('surveys')
      .insert([survey])
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create survey: ${error.message}`, 500);
    }

    return data;
  }

  async getSurveyByUserId(userId: string): Promise<Survey | null> {
    const { data, error } = await this.supabase
      .from('surveys')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AppError(`Failed to get survey: ${error.message}`, 500);
    }

    return data || null;
  }

  // Store operations
  async getStoreById(id: string): Promise<Store | null> {
    const { data, error } = await this.supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AppError(`Failed to get store: ${error.message}`, 500);
    }

    return data || null;
  }

  async getAllStores(): Promise<Store[]> {
    const { data, error } = await this.supabase
      .from('stores')
      .select('*')
      .order('name');

    if (error) {
      throw new AppError(`Failed to get stores: ${error.message}`, 500);
    }

    return data || [];
  }

  // Visit operations
  async createVisit(visitData: Omit<Visit, 'id' | 'created_at'>): Promise<Visit> {
    const visit: Visit = {
      id: generateUUID(),
      ...visitData,
      created_at: getCurrentTimestamp(),
    };

    const { data, error } = await this.supabase
      .from('visits')
      .insert([visit])
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create visit: ${error.message}`, 500);
    }

    return data;
  }

  async getVisitById(id: string): Promise<Visit | null> {
    const { data, error } = await this.supabase
      .from('visits')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AppError(`Failed to get visit: ${error.message}`, 500);
    }

    return data || null;
  }

  async updateVisit(id: string, updates: Partial<Omit<Visit, 'id' | 'created_at'>>): Promise<Visit> {
    const { data, error } = await this.supabase
      .from('visits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update visit: ${error.message}`, 500);
    }

    return data;
  }

  async getVisitsByUserId(userId: string, params: VisitQueryParams = {}): Promise<Visit[]> {
    let query = this.supabase
      .from('visits')
      .select(`
        *,
        stores (
          id,
          name,
          address
        )
      `)
      .eq('user_id', userId);

    if (params.dateFrom) {
      query = query.gte('check_in_at', params.dateFrom);
    }

    if (params.dateTo) {
      query = query.lte('check_in_at', params.dateTo);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    query = query.order('check_in_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new AppError(`Failed to get visits: ${error.message}`, 500);
    }

    return data || [];
  }

  async getVisitStatsForUser(userId: string): Promise<{
    totalVisits: number;
    favoriteStore: string;
    recentVisits: Array<{ date: string; storeName: string }>;
  }> {
    // Get all visits for the user with store information
    const { data: visits, error } = await this.supabase
      .from('visits')
      .select(`
        *,
        stores (
          name
        )
      `)
      .eq('user_id', userId)
      .order('check_in_at', { ascending: false });

    if (error) {
      throw new AppError(`Failed to get visit stats: ${error.message}`, 500);
    }

    const visitsData = visits || [];
    const totalVisits = visitsData.length;

    // Calculate favorite store
    const storeCounts = countBy(visitsData, 'store_id');
    const favoriteStoreId = Object.keys(storeCounts).reduce((a, b) => 
      storeCounts[a] > storeCounts[b] ? a : b
    , '');
    
    const favoriteStoreVisit = visitsData.find(v => v.store_id === favoriteStoreId);
    const favoriteStore = favoriteStoreVisit?.stores?.name || 'N/A';

    // Get recent visits (last 5)
    const recentVisits = visitsData.slice(0, 5).map(visit => ({
      date: visit.check_in_at,
      storeName: visit.stores?.name || 'Unknown Store',
    }));

    return {
      totalVisits,
      favoriteStore,
      recentVisits,
    };
  }

  async getVisitAnalyticsForUser(userId: string): Promise<{
    companionIndustry: ChartData;
    companionJobType: ChartData;
    visitPurpose: ChartData;
  }> {
    const visits = await this.getVisitsByUserId(userId);

    // Analyze companion industries
    const companionIndustryData: ChartData = {};
    visits.forEach(visit => {
      if (visit.companion_industries) {
        visit.companion_industries.forEach(industry => {
          companionIndustryData[industry] = (companionIndustryData[industry] || 0) + 1;
        });
      }
    });

    // Analyze companion job types
    const companionJobTypeData: ChartData = {};
    visits.forEach(visit => {
      if (visit.companion_job_types) {
        visit.companion_job_types.forEach(jobType => {
          companionJobTypeData[jobType] = (companionJobTypeData[jobType] || 0) + 1;
        });
      }
    });

    // Analyze visit purposes
    const visitPurposeData: ChartData = {};
    visits.forEach(visit => {
      if (visit.visit_purpose) {
        visitPurposeData[visit.visit_purpose] = (visitPurposeData[visit.visit_purpose] || 0) + 1;
      }
    });

    return {
      companionIndustry: companionIndustryData,
      companionJobType: companionJobTypeData,
      visitPurpose: visitPurposeData,
    };
  }

  async getMembershipCardData(lineUserId: string): Promise<MembershipCardData | null> {
    // Get user by LINE ID
    const user = await this.getUserByLineId(lineUserId);
    if (!user) {
      return null;
    }

    // Get visit stats and analytics
    const [stats, charts] = await Promise.all([
      this.getVisitStatsForUser(user.id),
      this.getVisitAnalyticsForUser(user.id),
    ]);

    // Mock LINE profile data (in production, this would come from LINE API)
    const profileData = {
      name: 'ユーザー', // Default name, should be fetched from LINE
      avatarUrl: 'https://via.placeholder.com/150', // Default avatar
    };

    return {
      profile: profileData,
      charts,
      stats,
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      return false;
    }
  }

  // Transaction helper (Supabase doesn't support transactions directly)
  async withTransaction<T>(callback: (db: DatabaseService) => Promise<T>): Promise<T> {
    // For now, just execute the callback
    // In a real implementation, you might want to implement rollback logic
    return await callback(this);
  }
}

// Export singleton instance
export const db = new DatabaseService();
export default db;