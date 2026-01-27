/**
 * Transaction Processing Utility
 * Calls Edge Function: POST /functions/v1/processTransaction
 */

import { supabase } from "../lib/supabase";

export interface ProcessTransactionInput {
  campaign_id: string;
  amount: number;
  currency?: string;
  payment_method?: string;
  external_ref?: string;
  user_id?: string;
}

export async function processTransaction(input: ProcessTransactionInput) {
  try {
    // Get current session (optional for MVP)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/processTransaction`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...input,
          user_id: input.user_id || session?.user.id,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to process transaction");
    }

    const { success, transaction, commission_earned } = await response.json();

    return {
      success,
      transaction,
      commission_earned,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
