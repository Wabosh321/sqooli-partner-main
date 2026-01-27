import { createClient } from "@supabase/supabase-js";

// Minimal server-side handler to call the secure `create_campaign` RPC.
// IMPORTANT: This file must run only on trusted server-side environment where
// `SUPABASE_SERVICE_ROLE_KEY` is available. Do NOT expose the service role to clients.

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    "createCampaignHandler: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set."
  );
}

export async function handleCreateCampaign(req: { body: any }) {
  const client = createClient(supabaseUrl, supabaseServiceRoleKey);
  const p = req.body;

  // Basic validation
  if (
    !p ||
    !p.partnerId ||
    !p.name ||
    !p.description ||
    !p.targetSignups ||
    !p.durationStart ||
    !p.durationEnd
  ) {
    return { status: 400, body: { error: "missing required fields" } };
  }

  try {
    const { data, error } = await client.rpc("create_campaign", {
      p_partner_id: p.partnerId,
      p_user_id: p.userId || null,
      p_program_id: p.programId || null,
      p_channel_id: p.channelId || null,
      p_subchannel: p.subchannel || null,
      p_name: p.name,
      p_description: p.description,
      p_target_signups: p.targetSignups,
      p_duration_start: p.durationStart,
      p_duration_end: p.durationEnd,
    });

    if (error) {
      return { status: 400, body: { error: error.message || "RPC error" } };
    }

    // RPC returns SETOF campaigns; return first row
    const campaign = Array.isArray(data) ? data[0] : data;
    return { status: 201, body: { campaign } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { status: 500, body: { error: message } };
  }
}

export default handleCreateCampaign;
