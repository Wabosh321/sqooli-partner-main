import { supabase } from '../supabase';
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';

export async function listTable(
  table: string,
  options: ListOptions & { filters?: Record<string, any> } = {}
): Promise<SupabaseResponse<any[]>> {
  try {
    let query = supabase.from(table).select('*') as any;

    // Apply filters
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        query = query.eq(key, value);
      }
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1);
    }

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function getById<T = any>(
  table: string,
  id: string | number
): Promise<SupabaseResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function insertRow<T = any>(
  table: string,
  payload: Partial<T>
): Promise<SupabaseResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert([payload] as any)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function insertBatch<T = any>(
  table: string,
  payload: Partial<T>[]
): Promise<SupabaseResponse<T[]>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert(payload as any)
      .select();
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function updateRow<T = any>(
  table: string,
  id: string | number,
  payload: Partial<T>
): Promise<SupabaseResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .update(payload as any)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function deleteRow(
  table: string,
  id: string | number
): Promise<SupabaseResponse<any>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}
