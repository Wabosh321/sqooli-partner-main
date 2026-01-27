import { supabase } from '../supabase';
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow, updateRow, deleteRow } from './genericHelpers';

export async function listNotifications(
  partnerId: string,
  options?: ListOptions
): Promise<SupabaseResponse<any[]>> {
  return listTable('notifications', {
    ...options,
    filters: { convex_id: partnerId },
  });
}

export async function getNotification(id: string): Promise<SupabaseResponse<any>> {
  return getById('notifications', id);
}

export async function getUnreadCount(partnerId: string): Promise<SupabaseResponse<number>> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('convex_id', partnerId)
      .eq('is_read', false);
    return { data: count ?? 0, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function createNotification(payload: Partial<any>): Promise<SupabaseResponse<any>> {
  return insertRow('notifications', payload);
}

export async function markAsRead(id: string): Promise<SupabaseResponse<any>> {
  return updateRow('notifications', id, {
    is_read: true,
    read_at: new Date().toISOString(),
  });
}

export async function markAllAsRead(partnerId: string): Promise<SupabaseResponse<any>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('convex_id', partnerId)
      .eq('is_read', false);
    return { data: null, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}

export async function deleteNotification(id: string): Promise<SupabaseResponse<any>> {
  return deleteRow('notifications', id);
}

export async function deleteReadNotifications(partnerId: string): Promise<SupabaseResponse<any>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('convex_id', partnerId)
      .eq('is_read', true);
    return { data: null, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}
