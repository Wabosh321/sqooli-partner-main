/**
 * Social Media Management Service
 * Handles partner social media accounts and channels
 * Only admin_partner users can manage social media for their organization
 */

import { supabase } from './supabase';

export interface SocialMediaAccount {
  id: string;
  partner_id: string;
  created_by_user_id: string;
  platform: 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'youtube' | 'linkedin' | 'whatsapp' | 'telegram' | 'custom';
  handle: string;
  url: string;
  follower_count: number;
  engagement_rate: number;
  is_verified: boolean;
  status: 'active' | 'inactive' | 'suspended';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  partner_id: string;
  social_media_id: string;
  name: string;
  subchannels: string[];
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all social media accounts for the current partner
 */
export async function fetchPartnerSocialMedia(): Promise<SocialMediaAccount[]> {
  try {
    const { data, error } = await supabase
      .from('social_media')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch social media accounts:', error);
    return [];
  }
}

/**
 * Fetch all channels for the current partner
 */
export async function fetchPartnerChannels(
  partnerId: string
): Promise<(Channel & { social_media?: SocialMediaAccount })[]> {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select(
        `
        *,
        social_media (
          id,
          platform,
          handle,
          url,
          follower_count,
          is_verified,
          engagement_rate,
          status,
          metadata
        )
      `
      )
      .eq('partner_id', partnerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch channels:', error);
    return [];
  }
}

/**
 * Add a new social media account (admin_partner only)
 */
export async function addSocialMediaAccount(
  platform: SocialMediaAccount['platform'],
  handle: string,
  url: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; data?: SocialMediaAccount; error?: string }> {
  try {
    // Call the RPC function that handles validation
    const { data, error } = await supabase.rpc('admin_add_social_media', {
      p_platform: platform,
      p_handle: handle,
      p_url: url,
      p_metadata: metadata,
    });

    if (error) throw error;

    if (data && data.error) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Failed to add social media account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update a social media account (admin_partner only)
 */
export async function updateSocialMediaAccount(
  socialMediaId: string,
  updates: Partial<SocialMediaAccount>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('social_media')
      .update(updates)
      .eq('id', socialMediaId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Failed to update social media account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a social media account (admin_partner only)
 */
export async function deleteSocialMediaAccount(
  socialMediaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('social_media')
      .delete()
      .eq('id', socialMediaId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Failed to delete social media account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get social media account with engagement stats
 */
export async function getSocialMediaStats(
  socialMediaId: string
): Promise<(SocialMediaAccount & { engagement_metrics?: any }) | null> {
  try {
    const { data, error } = await supabase
      .from('social_media')
      .select('*')
      .eq('id', socialMediaId)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Failed to fetch social media stats:', error);
    return null;
  }
}

/**
 * Verify social media account ownership (check if URL is reachable)
 */
export async function verifySocialMediaAccount(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get engagement metrics for social media account
 */
export async function fetchEngagementMetrics(socialMediaId: string) {
  try {
    const { data, error } = await supabase
      .from('social_media')
      .select(
        `
        id,
        platform,
        handle,
        follower_count,
        engagement_rate,
        channels (
          id,
          name,
          subchannels
        )
      `
      )
      .eq('id', socialMediaId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch engagement metrics:', error);
    return null;
  }
}

export default {
  fetchPartnerSocialMedia,
  fetchPartnerChannels,
  addSocialMediaAccount,
  updateSocialMediaAccount,
  deleteSocialMediaAccount,
  getSocialMediaStats,
  verifySocialMediaAccount,
  fetchEngagementMetrics,
};
