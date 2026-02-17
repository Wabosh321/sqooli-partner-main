// Subjects CRUD operations
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow } from './genericHelpers';

export async function listSubjects(options?: ListOptions): Promise<SupabaseResponse<any[]>> {
  return listTable('subjects', options);
}

export async function getSubject(id: string): Promise<SupabaseResponse<any>> {
  return getById('subjects', id);
}

export async function createSubject(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('subjects', payload);
}
