import { supabase } from '../supabase';
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, insertRow } from './genericHelpers';

export async function listPartnerRevenue(options?: ListOptions): Promise<SupabaseResponse<any[]>> {
  return listTable('withdrawals', options);
}

export async function getRevenueByPartner(
  partnerId: string,
  options?: ListOptions
): Promise<SupabaseResponse<any[]>> {
  return listTable('withdrawals', {
    ...options,
    filters: { partner_id: partnerId },
  });
}

export async function createPartnerRevenue(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('withdrawals', payload);
}

export async function getPartnerEarningsSummary(): Promise<SupabaseResponse<any[]>> {
  try {
    const { data, error } = await supabase.from('withdrawals').select('*');
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function getSystemEarningsTimeline(days: number = 30): Promise<SupabaseResponse<any[]>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .gte('created_at', startDate.toISOString().split('T')[0])
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function getTopEarningPartners(limit: number = 5): Promise<SupabaseResponse<any[]>> {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .limit(limit);
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}
