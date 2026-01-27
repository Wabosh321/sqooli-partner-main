import { supabase } from '../supabase';
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { insertRow } from './genericHelpers';

export async function createActivityLog(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('audit_logs', payload);
}

export async function getActivityLogs(
  partnerId: string,
  options?: ListOptions
): Promise<SupabaseResponse<any[]>> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('convex_id', partnerId);

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}
