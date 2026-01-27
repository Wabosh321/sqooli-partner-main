import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow, updateRow } from './genericHelpers';

export async function listPrograms(options?: ListOptions): Promise<SupabaseResponse<any[]>> {
  return listTable('programs', options);
}

export async function getProgram(id: string): Promise<SupabaseResponse<any>> {
  return getById('programs', id);
}

export async function createProgram(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('programs', payload);
}

export async function updateProgram(id: string, payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return updateRow('programs', id, payload);
}
