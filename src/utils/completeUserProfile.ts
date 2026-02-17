import { supabase } from "../lib/supabase";
import type { RegisterFormData } from "../types/auth.types";

/**
 * Complete user profile creation after email verification (PHASE 1 REFACTOR)
 * Calls atomic RPC: complete_onboarding_profile()
 * Replaces multi-step user + partner creation with single transaction
 */
export const completeUserProfile = async (
  registrationData?: RegisterFormData,
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

    const partnerType = regData.partnerType || "beneficiary";
    const fullName = `${regData.firstName.trim()} ${regData.lastName.trim()}`;

    // PHASE 1: Call atomic RPC instead of multi-step operations
    const { data: result, error: rpcError } = await supabase.rpc(
      "complete_onboarding_profile",
      {
        p_auth_id: user.id,
        p_email: user.email!,
        p_full_name: fullName,
        p_phone: regData.phoneNumber.trim(),
        p_username: regData.username.trim(),
        p_partner_type: partnerType,
      },
    );

    if (rpcError) {
      console.error("Failed to complete onboarding:", rpcError);
      return {
        success: false,
        message: rpcError.message || "Profile creation failed",
      };
    }

    if (!result || typeof result !== "object") {
      return { success: false, message: "No profile returned" };
    }

    const { user_id, partner_id } = result as {
      user_id: string;
      partner_id: string;
    };

    if (!user_id || !partner_id) {
      return {
        success: false,
        message: "Failed to create profile and partner",
      };
    }

    // Clear stored registration data
    sessionStorage.removeItem("pendingRegistration");

    return {
      success: true,
      message: "Profile created successfully!",
      userId: user_id,
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
