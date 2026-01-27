// Users CRUD operations
import { supabase } from '../supabase';
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow, updateRow, deleteRow } from './genericHelpers';

export async function listUsers(partnerId?: string, options?: ListOptions): Promise<SupabaseResponse<any[]>> {
  if (partnerId) {
    return listTable('users', { ...options, filters: { partner_id: partnerId } });
  }
  return listTable('users', options);
}

export async function getUser(id: string): Promise<SupabaseResponse<any>> {
  return getById('users', id);
}

export async function getUserByEmail(email: string): Promise<SupabaseResponse<any>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .maybeSingle();
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function createUser(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('users', payload);
}

export async function updateUser(id: string, payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return updateRow('users', id, payload);
}

export async function deleteUser(id: string): Promise<SupabaseResponse<any>> {
  return deleteRow('users', id);
}