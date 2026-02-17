/**
 * Unified Auth Verification System
 * Centralizes all database checks for authentication and authorization
 */

import { supabase } from "../lib/supabase";
import type { AuthenticatedUser, Partner } from "../types/auth.types";

/**
 * Verify and fetch authenticated user from Supabase
 * Returns user with role context and partner_id
 * Handles both team members and partner owners
 */
export async function verifyAuthenticatedUser(
  email: string,
): Promise<AuthenticatedUser | null> {
  try {
    // Check users table first (team members or partner owners)
    const { data: users } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (users && (users as any).length > 0) {
      const user = (users as any)[0];
      let partnerId = user.partner_id; // Could be null if user doesn't own a partner yet

      // If user doesn't have partner_id set, check if they own a partner (have partners.user_id = user.id)
      if (!partnerId) {
        const { data: ownedPartners } = await supabase
          .from("partners")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (ownedPartners && (ownedPartners as any).length > 0) {
          partnerId = (ownedPartners as any)[0].id;
        }
      }

      // Return user with their partner_id if they own/belong to a partner
      return {
        id: user.id,
        _id: user.id,
        email: user.email,
        role: user.role || "member",
        partner_id: partnerId, // Could be null (team member) or set (partner owner)
        created_at: user.created_at,
      } as AuthenticatedUser;
    }

    // Fallback: Check partners table (account owners) - support org_email and legacy email
    const { data: partners } = await supabase
      .from("partners")
      .select("*")
      .or(`org_email.eq.${email},email.eq.${email}`)
      .limit(1);

    if (partners && (partners as any).length > 0) {
      const partner = (partners as any)[0];
      // Return with partner ID so auth context knows which partner to load
      return {
        id: partner.user_id, // Return the user_id so we can load the user record too
        _id: partner.user_id,
        email: partner.org_email || partner.email,
        role: "partner",
        partner_id: partner.id, // Return the partner's ID
        created_at: partner.created_at,
      } as AuthenticatedUser;
    }

    return null;
  } catch (error) {
    console.error("Error verifying authenticated user:", error);
    return null;
  }
}

/**
 * Fetch partner data by ID
 * Includes all onboarding tracking fields
 */
export async function fetchPartnerData(
  partnerId: string,
): Promise<Partner | null> {
  try {
    const { data } = await supabase
      .from("partners")
      .select("*")
      .eq("id", partnerId)
      .limit(1);

    if (!data || (data as any).length === 0) return null;

    const p = (data as any)[0];

    return {
      id: p.id,
      _id: p.id,
      email: p.org_email || p.email,
      name: p.org_name || p.name,
      partner_type: p.partner_type,
      onboarding_completed: p.onboarding_completed,
      wallet_setup_completed: p.wallet_setup_completed,
      campaign_created: p.campaign_created,
      two_factor_setup_completed: p.two_factor_setup_completed,
      social_media_added: p.social_media_added,
      users_added: p.users_added,
      created_at: p.created_at,
      updated_at: p.updated_at,
    } as Partner;
  } catch (error) {
    console.error("Error in fetchPartnerData:", error);
    return null;
  }
}

/**
 * Complete onboarding for a partner
 * Updates database AND returns fresh partner data
 */
export async function completePartnerOnboarding(
  partnerId: string,
): Promise<Partner | null> {
  try {
    console.log("📝 Marking onboarding complete for partner:", partnerId);

    const { error: updateError } = await supabase
      .from("partners")
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", partnerId);

    if (updateError) {
      console.error("❌ Error updating onboarding_completed:", updateError);
      throw updateError;
    }

    // Wait a short moment for DB propagation
    await new Promise((r) => setTimeout(r, 100));

    // Fetch fresh partner data to confirm update
    let fresh = await fetchPartnerData(partnerId);
    if (fresh?.onboarding_completed) {
      console.log(
        "🔄 Verified: onboarding_completed =",
        fresh.onboarding_completed,
      );
      return fresh;
    }

    // Retry once after a slightly longer wait
    await new Promise((r) => setTimeout(r, 200));
    fresh = await fetchPartnerData(partnerId);
    if (fresh?.onboarding_completed) {
      console.log(
        "🔄 Verified on retry: onboarding_completed =",
        fresh.onboarding_completed,
      );
      return fresh;
    }

    console.warn(
      "⚠️ Onboarding update not observed after retries for partner:",
      partnerId,
    );
    return fresh;
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return null;
  }
}

/**
 * Verify partner onboarding status
 * Checks all required fields
 */
export function isOnboardingComplete(partner: Partner | null): boolean {
  if (!partner) return false;

  return (
    partner.wallet_setup_completed === true &&
    partner.campaign_created === true &&
    partner.onboarding_completed === true
  );
}

/**
 * Check if partner needs to complete onboarding
 */
export function needsOnboarding(partner: Partner | null): boolean {
  if (!partner) return true;
  return (
    !partner.onboarding_completed &&
    partner.wallet_setup_completed === true &&
    partner.campaign_created === true
  );
}

/**
 * Initialize complete auth context (PHASE 3 REFACTOR)
 * Uses single RPC call get_auth_context() instead of multiple queries
 * Replaces separate verifyAuthenticatedUser + fetchPartnerData calls
 */
export async function initializeAuthContext(): Promise<{
  user: AuthenticatedUser | null;
  partner: Partner | null;
  isAuthenticated: boolean;
}> {
  try {
    // Get Supabase auth session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      console.debug("No session found during auth init");
      return { user: null, partner: null, isAuthenticated: false };
    }

    console.debug("initializeAuthContext: auth_id ->", session.user.id);

    // PHASE 3: Use get_auth_context RPC to fetch user + partner in single call
    const { data: authContextResult, error: contextError } = await supabase.rpc(
      "get_auth_context",
      { p_auth_id: session.user.id },
    );

    if (contextError) {
      console.error("Error fetching auth context:", contextError);
      return { user: null, partner: null, isAuthenticated: false };
    }

    if (!authContextResult || !Array.isArray(authContextResult)) {
      console.warn("No auth context returned");
      return { user: null, partner: null, isAuthenticated: false };
    }

    // RPC returns array with single row
    const ctx = authContextResult[0];
    if (!ctx) {
      console.warn("Auth context row is empty");
      return { user: null, partner: null, isAuthenticated: false };
    }

    // Map RPC result to AuthenticatedUser type
    const user: AuthenticatedUser = {
      id: ctx.user_id,
      _id: ctx.user_id,
      email: ctx.email,
      role: ctx.role || "member",
      partner_id: ctx.partner_id,
      is_first_login: ctx.is_first_login,
      created_at: new Date().toISOString(),
    };

    // Map RPC result to Partner type (if partner exists)
    let partner: Partner | null = null;
    if (ctx.partner_id) {
      partner = {
        id: ctx.partner_id,
        _id: ctx.partner_id,
        email: ctx.email,
        name: ctx.email, // Set name to email if not available
        partner_type: ctx.partner_type,
        onboarding_completed: ctx.partner_onboarding_completed,
        wallet_setup_completed: ctx.wallet_setup_completed,
        campaign_created: ctx.campaign_created,
        two_factor_setup_completed: false, // Not included in RPC result
        social_media_added: false,
        users_added: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    console.debug("✅ Auth context initialized:", {
      email: user.email,
      role: user.role,
      hasPartner: !!partner,
      onboarding_completed: partner?.onboarding_completed,
    });

    return {
      user,
      partner,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("Error initializing auth context:", error);
    return { user: null, partner: null, isAuthenticated: false };
  }
}
