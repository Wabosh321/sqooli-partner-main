/**
 * Edge Function: Process Transaction
 * POST /functions/v1/processTransaction
 * 
 * Records a payment transaction for a campaign.
 * Simplified MVP: Assumes M-Pesa verification done upstream.
 * Updates campaign amount and partner wallet balance.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Extract JWT from Authorization header (optional for MVP)
    const authHeader = req.headers.get("Authorization");

    // Parse request body
    const {
      campaign_id,
      amount,
      currency = "KES",
      payment_method = "mpesa",
      external_ref,
      user_id,
    } = await req.json();

    // Validate input
    if (!campaign_id || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: campaign_id, amount" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } }
    );

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("campaigns")
      .select("id, partner_id, current_amount, commission_rate")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabaseAdmin
      .from("transactions")
      .insert({
        campaign_id,
        user_id,
        partner_id: campaign.partner_id,
        amount: parseFloat(amount),
        currency,
        status: "completed", // MVP: Assume verified
        payment_method,
        external_ref,
        transaction_type: "payment",
        metadata: {
          verified_at: new Date().toISOString(),
          commission_rate: campaign.commission_rate,
        },
      })
      .select()
      .single();

    if (txError) {
      console.error("Transaction creation error:", txError);
      return new Response(JSON.stringify({ error: txError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update campaign current_amount
    const newCampaignAmount = (campaign.current_amount || 0) + parseFloat(amount);
    await supabaseAdmin
      .from("campaigns")
      .update({ current_amount: newCampaignAmount })
      .eq("id", campaign_id);

    // Calculate commission earned by partner
    const commissionEarned = (parseFloat(amount) * campaign.commission_rate) / 100;

    // Update wallet balance
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("balance, total_earned")
      .eq("partner_id", campaign.partner_id)
      .single();

    if (!walletError && wallet) {
      await supabaseAdmin
        .from("wallets")
        .update({
          balance: (wallet.balance || 0) + commissionEarned,
          total_earned: (wallet.total_earned || 0) + commissionEarned,
        })
        .eq("partner_id", campaign.partner_id);
    }

    // Log to audit
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: user_id,
      action: "process_transaction",
      resource_type: "transaction",
      resource_id: transaction.id,
      changes: {
        campaign_amount: newCampaignAmount,
        commission_earned: commissionEarned,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        transaction,
        commission_earned: commissionEarned,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
