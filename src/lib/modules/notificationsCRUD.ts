// Notifications CRUD operations
import { supabase } from '../supabase';
import type { SupabaseResponse, ListOptions } from '../supabaseCRUD';
import { listTable, getById, insertRow, updateRow, deleteRow } from './genericHelpers';

export async function listNotifications(
  partnerId: string,
  options?: ListOptions
): Promise<SupabaseResponse<any[]>> {
  const res = await listTable('notifications', {
    ...options,
    filters: { partner_id: partnerId },
  });

  // Normalize DB columns to the shape expected by the UI/component
  if (res.data && Array.isArray(res.data)) {
    const mapped = res.data.map((r: any) => ({
      // keep both forms so components using either will work
      id: r.id,
      _id: r.id,
      title: r.title,
      message: r.message,
      type: r.type,
      is_read: r.is_read,
      isRead: !!r.is_read,
      read_at: r.read_at,
      created_at: r.created_at,
      createdAt: r.created_at ? new Date(r.created_at).getTime() : null,
      raw: r,
    }));
    return { data: mapped, error: res.error };
  }

  return res;
}

export async function getNotification(id: string): Promise<SupabaseResponse<any>> {
  return getById('notifications', id);
}

export async function getUnreadCount(partnerId: string): Promise<SupabaseResponse<number>> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerId)
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
      .eq('partner_id', partnerId)
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
      .eq('partner_id', partnerId)
      .eq('is_read', true);
    return { data: null, error };
  } catch (error) {
    return { data: null, error: error as any };
  }
}
