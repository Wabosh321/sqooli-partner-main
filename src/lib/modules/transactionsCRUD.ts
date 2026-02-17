// Transactions CRUD operations
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow } from './genericHelpers';

export async function listTransactions(options?: ListOptions): Promise<SupabaseResponse<any[]>> {
  return listTable('transactions', options);
}

export async function getTransaction(id: string): Promise<SupabaseResponse<any>> {
  return getById('transactions', id);
}

export async function getTransactionsByWallet(
  walletId: string,
  options?: ListOptions
): Promise<SupabaseResponse<any[]>> {
  return listTable('transactions', {
    ...options,
    filters: { wallet_id: walletId },
  });
}

export async function createTransaction(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('transactions', payload);
}
