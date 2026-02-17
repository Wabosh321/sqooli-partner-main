import { useEffect, useState } from "react";
import type {
  AuthenticatedUser,
  ConvexPartner,
  ConvexUser,
  UseAuthReturn,
} from "../types/auth.types";
import { supabase } from "../lib/supabase";
import {
  initializeAuthContext,
  fetchPartnerData,
  verifyAuthenticatedUser,
} from "../utils/verifyAuthData";
import { useLogger } from "@jelly/logger";

export function useAuth(): UseAuthReturn {
  let logger;
  try {
    logger = useLogger();
  } catch {
    // Fallback if LoggerProvider not available
    logger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };
  }
  const [laravelUser, setLaravelUser] = useState<AuthenticatedUser | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<ConvexUser | null>(null);
  const [partner, setPartner] = useState<ConvexPartner | null>(null);

  // Define initialization logic that can be called multiple times
  const initAuth = async () => {
    logger.info("Auth hook initialization started", { userId: "anonymous" });
    try {
      // Use unified verification system
      const {
        user: authUser,
        partner: authPartner,
        isAuthenticated,
      } = await initializeAuthContext();

      logger.info("Auth context initialization completed", {
        userId: authUser?.id || "anonymous",
        isAuthenticated,
        hasUser: !!authUser,
        hasPartner: !!authPartner,
      });

      if (!isAuthenticated || !authUser) {
        logger.info("User not authenticated, clearing auth state", {
          userId: "anonymous",
        });
        setSupabaseUser(null);
        setPartner(null);
        setLoading(false);
        return;
      }

      // Set user state
      setSupabaseUser({
        _id: authUser.id,
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        partner_id: authPartner?.id || authUser.id,
        is_first_login: authUser.is_first_login || false,
      } as ConvexUser);

      // Set partner state if found
      if (authPartner) {
        setPartner(authPartner as ConvexPartner);
        logger.info("Auth hook: Partner loaded", {
          userId: authUser.id,
          id: authPartner.id,
          type: authPartner.partner_type,
          onboarding_completed: authPartner.onboarding_completed,
        });
      }

      logger.info("Auth hook completed successfully", {
        userId: authUser.id,
        hasPartner: !!authPartner,
      });

      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error(
        "Auth initialization error",
        { error_message: errorMessage },
        err as Error,
      );
      console.error("Auth initialization error:", err);
      setError("Authentication check failed");
      setSupabaseUser(null);
      setPartner(null);
      setLoading(false);
    }
  };

  // Step 1: Try both Laravel and Supabase auth
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
      loginMethod: "supabase",
      refetch: initAuth,
    };
  }

  // NOT AUTHENTICATED
  return {
    user: null,
    partner: null,
    loading: false,
    error: error || "Not authenticated",
    isFirstLogin: false,
    loginMethod: null,
    refetch: initAuth,
  };
}
