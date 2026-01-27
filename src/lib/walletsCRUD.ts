import { supabase } from '../supabase';
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow, updateRow } from './genericHelpers';

export async function listWallets(options?: ListOptions): Promise<SupabaseResponse<any[]>> {
  return listTable('wallets', options);
}

export async function getWallet(id: string): Promise<SupabaseResponse<any>> {
  return getById('wallets', id);
}

export async function getWalletByPartnerId(partnerId: string): Promise<SupabaseResponse<any>> {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('partner_id', partnerId)
      .limit(1)
      .maybeSingle();
    return { data, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function createWallet(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('wallets', payload);
}

export async function updateWallet(id: string, payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return updateRow('wallets', id, payload);
}
