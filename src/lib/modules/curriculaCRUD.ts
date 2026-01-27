// Curricula CRUD operations
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow, updateRow } from './genericHelpers';

export async function listCurricula(options?: ListOptions): Promise<SupabaseResponse<any[]>> {
  return listTable('curricula', options);
}

export async function getCurriculum(id: string): Promise<SupabaseResponse<any>> {
  return getById('curricula', id);
}

export async function createCurriculum(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('curricula', payload);
}

export async function updateCurriculum(id: string, payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return updateRow('curricula', id, payload);
}