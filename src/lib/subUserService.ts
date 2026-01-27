/**
 * Sub-User Management Service
 * Allows admin_partner to create and manage media_partner sub-users
 * Sub-users are tied to the same partner organization
 */

import { supabase } from './supabase';

export interface SubUserRequest {
  email: string;
  full_name: string;
  phone?: string;
  username?: string;
}

export interface SubUserResponse {
  user_id?: string;
  email: string;
  error?: string;
}

export interface SubUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  username: string;
  role: 'media_partner';
  partner_id: string;
  parent_user_id: string;
  is_sub_user: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new media_partner sub-user under the current admin_partner
 * Only admin_partner users can create sub-users
 */
export async function createMediaPartnerSubUser(
  request: SubUserRequest
): Promise<SubUserResponse> {
  try {
    const { data, error } = await supabase.rpc('create_media_partner_sub_user', {
      p_email: request.email,
      p_full_name: request.full_name,
      p_phone: request.phone || null,
      p_username: request.username || null,
    });

    if (error) throw error;

    // RPC returns array with single object
    const result = Array.isArray(data) ? data[0] : data;

    return {
      user_id: result.user_id,
      email: result.email,
      error: result.error,
    };
  } catch (error) {
    console.error('Failed to create sub-user:', error);
    return {
      email: request.email,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Fetch all sub-users created by the current admin_partner
 */
export async function fetchMySubUsers(): Promise<SubUser[]> {
  try {
    // Get current user info
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user?.id) {
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('parent_user_id', authUser.user.id)
      .eq('is_sub_user', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch sub-users:', error);
    return [];
  }
}

/**
 * Get details of a specific sub-user
 */
export async function getSubUserDetails(userId: string): Promise<SubUser | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('is_sub_user', true)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Failed to fetch sub-user details:', error);
    return null;
  }
}

/**
 * Update sub-user information
 * Only the parent admin_partner or super_admin can update
 */
export async function updateSubUser(
  userId: string,
  updates: Partial<SubUser>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .eq('is_sub_user', true);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Failed to update sub-user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Deactivate a sub-user (soft delete)
 */
export async function deactivateSubUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: 'inactive' })
      .eq('id', userId)
      .eq('is_sub_user', true);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Failed to deactivate sub-user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get sub-users and their assigned social media accounts
 */
export async function fetchSubUsersWithSocialMedia() {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user?.id) {
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        full_name,
        role,
        created_at,
        social_media (
          id,
          platform,
          handle,
          url,
          status
        )
      `
      )
      .eq('parent_user_id', authUser.user.id)
      .eq('is_sub_user', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch sub-users with social media:', error);
    return [];
  }
}

/**
 * Check if current user is an admin_partner
 */
export async function isAdminPartner(): Promise<boolean> {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user?.id) {
      return false;
    }

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.user.id)
      .single();

    if (error) throw error;
    return data?.role === 'admin_partner';
  } catch (error) {
    console.error('Failed to check admin_partner status:', error);
    return false;
  }
}

/**
 * Get admin partner's organization info with all sub-users
 */
export async function getAdminPartnerOrganization() {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user?.id) {
      return null;
    }

    // Fetch current user and their partner
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        full_name,
        role,
        partner_id,
        partners (
          id,
          org_name,
          org_email,
          org_phone,
          partner_type,
          social_media (
            id,
            platform,
            handle,
            url,
            follower_count,
            is_verified,
            status
          )
        )
      `
      )
      .eq('id', authUser.user.id)
      .eq('role', 'admin_partner')
      .single();

    if (userError) throw userError;

    // Fetch all sub-users
    const { data: subUsers, error: subUsersError } = await supabase
      .from('users')
      .select('*')
      .eq('parent_user_id', authUser.user.id)
      .eq('is_sub_user', true);

    if (subUsersError) throw subUsersError;

    return {
      admin: userData,
      subUsers: subUsers || [],
    };
  } catch (error) {
    console.error('Failed to fetch organization details:', error);
    return null;
  }
}

export default {
  createMediaPartnerSubUser,
  fetchMySubUsers,
  getSubUserDetails,
  updateSubUser,
  deactivateSubUser,
  fetchSubUsersWithSocialMedia,
  isAdminPartner,
  getAdminPartnerOrganization,
};
