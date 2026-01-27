import { supabase } from "../lib/supabase";
import type { RegisterFormData } from "../types/auth.types";

/**
 * Map partner type to default user role within that partner
 */
const getDefaultRoleForPartnerType = (partnerType?: string): string => {
  switch (partnerType) {
    case "affiliate":
      return "affiliate_agent";
    case "media":
      return "media_manager";
    case "corporate":
      return "corporate_admin";
    case "institutional":
      return "hub_manager";
    default:
      return "member"; // Fallback role
  }
};

/**
 * Complete user profile creation after email verification
 * Store registration data in sessionStorage during signup, then call this after verification
 */
export const completeUserProfile = async (
  registrationData?: RegisterFormData
): Promise<{ success: boolean; message: string; userId?: string }> => {
  try {
    // Get current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Check if email is verified
    if (!user.email_confirmed_at) {
      return { success: false, message: "Email not verified yet" };
    }

    // Get registration data from sessionStorage if not provided
    let regData = registrationData;
    if (!regData) {
      const stored = sessionStorage.getItem("pendingRegistration");
      if (stored) {
        regData = JSON.parse(stored);
      } else {
        return { success: false, message: "Registration data not found" };
      }
    }

    if (!regData) {
      return { success: false, message: "Missing registration data" };
    }

    // Determine partner type and default role
    const partnerType = regData.partnerType || "affiliate";
    const defaultRole = getDefaultRoleForPartnerType(partnerType);

    // Call the RPC function to create profile
    const { data: profile, error: profileError } = await supabase
      .rpc("create_user_profile", {
        p_auth_id: user.id,
        p_email: user.email!,
        p_full_name: `${regData.firstName.trim()} ${regData.lastName.trim()}`,
        p_phone: regData.phoneNumber.trim(),
        p_username: regData.username.trim(),
      })
      .select()
      .single();

    if (profileError) {
      console.error("Failed to create profile:", profileError);
      return {
        success: false,
        message: profileError.message || "Profile creation failed",
      };
    }

    if (!profile || typeof profile !== "object" || !("id" in profile)) {
      return { success: false, message: "No profile returned" };
    }

    const profileData = profile as { id: string };

    // Update user profile with partner_role and partner details
    const { error: updateError } = await supabase
      .from("users")
      .update({
        partner_role: defaultRole,
        // Optional: add other partner-specific fields
      })
      .eq("id", profileData.id);

    if (updateError) {
      console.warn("Failed to update user role:", updateError);
    }

    // Create partner record with partner type
    try {
      const { error: partnerError } = await supabase.from("partners").insert({
        user_id: profileData.id,
        org_name: `${regData.firstName.trim()} ${regData.lastName.trim()}`,
        org_email: user.email,
        org_phone: regData.phoneNumber.trim(),
        partner_type: partnerType, // Store partner type
        // These will be NULL initially - can be set later
        access_level: null,
        commission_rate: null,
      });

      if (partnerError) {
        console.warn("Failed to create partner record:", partnerError);
      }
    } catch (err) {
      console.warn("Failed to create partner record:", err);
      // Don't fail if partner creation fails - profile is created
    }

    // Clear stored registration data
    sessionStorage.removeItem("pendingRegistration");

    return {
      success: true,
      message: "Profile created successfully!",
      userId: profileData.id,
    };
  } catch (error) {
    console.error("Error completing profile:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
