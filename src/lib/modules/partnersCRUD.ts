// Partners CRUD operations
import { supabase } from '../supabase';
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow, updateRow, deleteRow } from './genericHelpers';

export async function listPartners(options?: ListOptions): Promise<SupabaseResponse<any[]>> {
  return listTable('partners', options);
}

export async function getPartner(id: string): Promise<SupabaseResponse<any>> {
  return getById('partners', id);
}

export async function getPartnerByEmail(email: string): Promise<SupabaseResponse<any>> {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('email', email)
      .limit(1)
      .maybeSingle();
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function createPartner(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('partners', payload);
}

export async function updatePartner(id: string, payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return updateRow('partners', id, payload);
}

export async function deletePartner(id: string): Promise<SupabaseResponse<any>> {
  return deleteRow('partners', id);
}