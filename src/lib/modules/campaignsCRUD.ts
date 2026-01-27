// Campaigns CRUD operations
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow, updateRow, deleteRow } from './genericHelpers';

export async function listCampaigns(options?: ListOptions): Promise<SupabaseResponse<any[]>> {
  return listTable('campaigns', options);
}

export async function getCampaign(id: string): Promise<SupabaseResponse<any>> {
  return getById('campaigns', id);
}

export async function getCampaignsByPartner(
  partnerId: string,
  options?: ListOptions
): Promise<SupabaseResponse<any[]>> {
  return listTable('campaigns', { ...options, filters: { partner_id: partnerId } });
}

export async function createCampaign(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('campaigns', payload);
}

export async function updateCampaign(id: string, payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return updateRow('campaigns', id, payload);
}

export async function deleteCampaign(id: string): Promise<SupabaseResponse<any>> {
  return deleteRow('campaigns', id);
}