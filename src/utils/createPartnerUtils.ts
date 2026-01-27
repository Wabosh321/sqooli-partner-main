/**
 * Partner Creation Utility
 * Calls Edge Function: POST /functions/v1/createPartner
 */

import { supabase } from "../lib/supabase";

export interface CreatePartnerInput {
  org_name: string;
  org_email?: string;
  org_phone?: string;
  description?: string;
  logo_url?: string;
}

export async function createPartnerAccount(input: CreatePartnerInput) {
  try {
    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Not authenticated");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(
      `${supabaseUrl}/functions/v1/createPartner`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create partner");
    }

    const { success, partner } = await response.json();

    return {
      success,
      partner,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
