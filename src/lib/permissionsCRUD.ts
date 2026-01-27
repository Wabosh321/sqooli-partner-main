import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow, updateRow } from './genericHelpers';

export async function getPermissions(userId: string): Promise<SupabaseResponse<any[]>> {
  return listTable('permissions', {
    filters: { convex_id: userId },
  });
}

export async function createPermission(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('permissions', payload);
}

export async function updatePermission(id: string, payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return updateRow('permissions', id, payload);
}

export async function deletePermission(id: string): Promise<SupabaseResponse<any>> {
  const { getById: _getById, deleteRow } = await import('./genericHelpers');
  return deleteRow('permissions', id);
}
