// Withdrawals CRUD operations
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow, updateRow } from './genericHelpers';

export async function listWithdrawals(options?: ListOptions): Promise<SupabaseResponse<any[]>> {
  return listTable('withdrawals', options);
}

export async function getWithdrawal(id: string): Promise<SupabaseResponse<any>> {
  return getById('withdrawals', id);
}

export async function getWithdrawalsByPartner(
  partnerId: string,
  options?: ListOptions
): Promise<SupabaseResponse<any[]>> {
  return listTable('withdrawals', {
    ...options,
    filters: { partner_id: partnerId },
  });
}

export async function createWithdrawal(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('withdrawals', payload);
}

export async function updateWithdrawal(id: string, payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return updateRow('withdrawals', id, payload);
}

export async function approveWithdrawal(
  id: string,
  approvedBy: string
): Promise<SupabaseResponse<any>> {
  return updateWithdrawal(id, {
    status: 'approved',
    approved_by: approvedBy,
    approved_at: new Date().toISOString(),
  });
}

export async function rejectWithdrawal(
  id: string,
  rejectionReason: string
): Promise<SupabaseResponse<any>> {
  return updateWithdrawal(id, {
    status: 'rejected',
    rejection_reason: rejectionReason,
    rejected_at: new Date().toISOString(),
  });
}
