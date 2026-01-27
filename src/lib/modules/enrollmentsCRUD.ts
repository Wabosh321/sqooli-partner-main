// Program Enrollments CRUD operations
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow } from './genericHelpers';

export async function listEnrollments(options?: ListOptions): Promise<SupabaseResponse<any[]>> {
  return listTable('program_enrollments', options);
}

export async function getEnrollment(id: string): Promise<SupabaseResponse<any>> {
  return getById('program_enrollments', id);
}

export async function getEnrollmentsByCampaign(
  campaignId: string,
  options?: ListOptions
): Promise<SupabaseResponse<any[]>> {
  return listTable('program_enrollments', {
    ...options,
    filters: { campaign_id: campaignId },
  });
}

export async function createEnrollment(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('program_enrollments', payload);
}