import { useEffect, useState } from "react";
import type { Partner, ConvexUser, UseAuthReturn } from "../types/auth.types";
import { supabase } from "../lib/supabase";

export function useAuth(): UseAuthReturn {
  const [supabaseUser, setSupabaseUser] = useState<ConvexUser | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initAuth = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setSupabaseUser(null);
        setPartner(null);
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
        id, 
        email, 
        full_name, 
        role, 
        partner_id, 
        access_level, 
        permissions,
        partner:partners(
          id, 
          org_name, 
          partner_type, 
          access_level, 
          commission_rate, 
          onboarding_completed
        )
      `,
        )
        .eq("id", userId)
        .single();

      if (profileError) {
        setSupabaseUser(null);
        setPartner(null);
        setLoading(false);
        return;
      }

      const mappedUser: ConvexUser = {
        _id: profile.id,
        id: profile.id,
        email: profile.email,
        role: profile.role,
        partner_id: profile.partner_id,
        is_first_login: false,
      };

      const partnerData = Array.isArray(profile.partner)
        ? profile.partner[0]
        : profile.partner;
      const mappedPartner: Partner = {
        id: profile.partner_id,
        org_name: partnerData?.org_name || "",
        partner_type: partnerData?.partner_type || "",
        access_level: partnerData?.access_level || 0,
        commission_rate: partnerData?.commission_rate || 0,
        onboarding_completed: partnerData?.onboarding_completed || false,
        created_at: partnerData?.created_at,
        updated_at: partnerData?.updated_at,
      };

      setSupabaseUser(mappedUser);
      setPartner(mappedPartner);
      setLoading(false);
    } catch (err) {
      setError("Authentication check failed");
      setSupabaseUser(null);
      setPartner(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          initAuth();
        } else if (event === "SIGNED_OUT") {
          setSupabaseUser(null);
          setPartner(null);
        }
      },
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

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
