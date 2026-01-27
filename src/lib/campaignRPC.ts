/**
 * Campaign creation helper — safely call the create_campaign RPC from backend
 * 
 * This file provides:
 * - createCampaignRPC(): call via service_role key (backend/secure endpoint only)
 * - Validation before calling RPC
 * - Error handling with user-friendly messages
 */

import { SupabaseClient } from "@supabase/supabase-js";

export interface CreateCampaignParams {
  partnerId: string;
  userId?: string;
  programId?: string;
  channelId?: string;
  subchannel?: string;
  name: string;
  description: string;
  targetSignups: number;
  durationStart: Date | string; // ISO date or Date object
  durationEnd: Date | string;
}

export interface CreateCampaignResponse {
  id: string;
  partner_id: string;
  user_id?: string;
  program_id?: string;
  channel_id?: string;
  subchannel?: string;
  name: string;
  description: string;
  target_signups: number;
  duration_start: string;
  duration_end: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a campaign via RPC function
 * 
 * IMPORTANT: This should ONLY be called from the backend using a service_role key,
 * NOT from the client. Ensure this endpoint is protected by authentication/authorization.
 * 
 * @param supabaseClient - Supabase client initialized with service_role key
 * @param params - Campaign creation parameters
 * @returns Campaign object if successful
 * @throws Error with user-friendly message if validation fails
 */
export async function createCampaignRPC(
  supabaseClient: SupabaseClient,
  params: CreateCampaignParams
): Promise<CreateCampaignResponse> {
  // Client-side validation
  if (!params.partnerId) {
    throw new Error("Partner ID is required");
  }
  if (!params.name || params.name.trim() === "") {
    throw new Error("Campaign name is required");
  }
  if (!params.description || params.description.trim() === "") {
    throw new Error("Campaign description is required");
  }
  if (!params.targetSignups || params.targetSignups <= 0) {
    throw new Error("Target signups must be a positive number");
  }

  // Convert dates to ISO strings
  const startDate = params.durationStart instanceof Date
    ? params.durationStart.toISOString().split("T")[0]
    : params.durationStart;
  const endDate = params.durationEnd instanceof Date
    ? params.durationEnd.toISOString().split("T")[0]
    : params.durationEnd;

  if (startDate > endDate) {
    throw new Error("Start date must be before or equal to end date");
  }

  try {
    const { data, error } = await supabaseClient.rpc("create_campaign", {
      p_partner_id: params.partnerId,
      p_user_id: params.userId || null,
      p_program_id: params.programId || null,
      p_channel_id: params.channelId || null,
      p_subchannel: params.subchannel || null,
      p_name: params.name,
      p_description: params.description,
      p_target_signups: params.targetSignups,
      p_duration_start: startDate,
      p_duration_end: endDate,
    });

    if (error) {
      // Server-side validation errors from RPC
      throw new Error(error.message || "Failed to create campaign");
    }

    if (!data || data.length === 0) {
      throw new Error("Campaign creation returned no result");
    }

    return data[0] as CreateCampaignResponse;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error creating campaign";
    throw new Error(`Campaign creation failed: ${message}`);
  }
}

/**
 * Example usage in a backend API route or edge function
 * 
 * ```typescript
 * import { createClient } from "@supabase/supabase-js";
 * import { createCampaignRPC } from "@/lib/campaignRPC";
 * 
 * const supabase = createClient(
 *   process.env.SUPABASE_URL!,
 *   process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role, never expose to client
 * );
 * 
 * export async function POST(req: Request) {
 *   const body = await req.json();
 * 
 *   try {
 *     const campaign = await createCampaignRPC(supabase, {
 *       partnerId: body.partnerId,
 *       userId: body.userId,
 *       programId: body.programId,
 *       channelId: body.channelId,
 *       subchannel: body.subchannel,
 *       name: body.name,
 *       description: body.description,
 *       targetSignups: body.targetSignups,
 *       durationStart: body.durationStart,
 *       durationEnd: body.durationEnd,
 *     });
 *
 *     return Response.json({ success: true, campaign }, { status: 201 });
 *   } catch (err: unknown) {
 *     const msg = err instanceof Error ? err.message : "Unknown error";
 *     return Response.json({ success: false, error: msg }, { status: 400 });
 *   }
 * }
 * ```
 */
