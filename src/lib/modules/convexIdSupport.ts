// Legacy Convex ID support
import { supabase } from '../supabase';
import type { SupabaseResponse } from '../supabaseCRUD';
import type { Database } from '../../types/database.types';
import { getById, updateRow, insertRow } from './genericHelpers';

export async function findByConvexId<T extends keyof Database['public']['Tables']>(
  table: T,
  convexId: string
): Promise<SupabaseResponse<Database['public']['Tables'][T]['Row']>> {
  try {
    const { data, error } = await supabase
      .from(table as string)
      .select('*')
      .eq('legacy_convex_id', convexId)
      .limit(1)
      .maybeSingle();
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function upsertWithConvexId<T extends keyof Database['public']['Tables']>(
  table: T,
  convexId: string,
  payload: Database['public']['Tables'][T]['Insert'] & { legacy_convex_id?: string }
): Promise<SupabaseResponse<Database['public']['Tables'][T]['Row']>> {
  try {
    const existing = await findByConvexId<T>(table, convexId);

    if (existing.data) {
      return updateRow(table as string, (existing.data as any).id, payload);
    } else {
      const toInsert = { ...payload, legacy_convex_id: convexId };
      return insertRow(table as string, toInsert);
    }
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function upsertWithConvexIdRelaxed(
  table: string,
  convexId: string,
  payload: Partial<any>
): Promise<SupabaseResponse<any>> {
  try {
    const existing = await getById(table, convexId);

    if (existing.data) {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', existing.data.id);
      return { data, error };
    } else {
      const { data, error } = await supabase
        .from(table)
        .insert({ ...payload, legacy_convex_id: convexId });
      return { data, error };
    }
  } catch (error) {
    return { data: null, error: error as any };
  }
}
