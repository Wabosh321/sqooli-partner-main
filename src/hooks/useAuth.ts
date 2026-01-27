import { useEffect, useState } from "react";
import type {
  AuthenticatedUser,
  ConvexPartner,
  ConvexUser,
  UseAuthReturn,
} from "../types/auth.types";
import { getJsonAuthUser, isJsonAuthenticated } from "../auth/handleJsonAuth";

export function useAuth(): UseAuthReturn {
  const [supabaseUser, setSupabaseUser] = useState<ConvexUser | null>(null);
  const [partner, setPartner] = useState<ConvexPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define initialization logic that can be called multiple times
  const initAuth = async () => {
    try {
      setLoading(true);

      // Check JSON authentication
      if (!isJsonAuthenticated()) {
        setSupabaseUser(null);
        setPartner(null);
        setLoading(false);
        return;
      }

      const jsonUser = getJsonAuthUser();
      if (!jsonUser) {
        setSupabaseUser(null);
        setPartner(null);
        setLoading(false);
        return;
      }

      // Map JSON user to ConvexUser
      const mappedUser: ConvexUser = {
        _id: jsonUser.id,
        id: jsonUser.id,
        email: jsonUser.email,
        role: jsonUser.role,
        partner_id: jsonUser.partner_id,
        is_first_login: jsonUser.is_first_login ?? false,
        partner_role: jsonUser.role,
      };

      // Create partner object from JSON user
      const mappedPartner: ConvexPartner = {
        _id: jsonUser.partner_id,
        id: jsonUser.partner_id,
        user_id: jsonUser.id,
        partner_type: jsonUser.partner_type,
        access_level: jsonUser.access_level,
        onboarding_completed: !jsonUser.is_first_login,
        org_name: `Partner ${jsonUser.partner_id}`,
      };

      setSupabaseUser(mappedUser);
      setPartner(mappedPartner);

      console.debug("🔐 useAuth: JSON User loaded", {
        id: jsonUser.id,
        email: jsonUser.email,
        role: jsonUser.role,
        partner_type: jsonUser.partner_type,
      });

      setLoading(false);
    } catch (err) {
      console.error("Auth initialization error:", err);
      setError("Authentication check failed");
      setSupabaseUser(null);
      setPartner(null);
      setLoading(false);
    }
  };

  // Initialize auth on mount
  useEffect(() => {
    initAuth();
  }, []);

  // Return auth state
  if (loading) {
    return {
      user: null,
      partner: null,
      loading: true,
      error: null,
      isFirstLogin: false,
      loginMethod: null,
      refetch: initAuth,
    };
  }

  if (supabaseUser) {
    return {
      user: supabaseUser,
      partner: partner || null,
      loading: false,
      error: null,
      isFirstLogin: supabaseUser.is_first_login ?? false,
      loginMethod: "json",
      refetch: initAuth,
    };
  }

  // NOT AUTHENTICATED
  return {
    user: null,
    partner: null,
    loading: false,
    error: error || null,
    isFirstLogin: false,
    loginMethod: null,
    refetch: initAuth,
  };
}
