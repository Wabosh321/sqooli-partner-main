import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";
import type { AuthenticatedUser, Partner } from "../types/auth.types";

const PROFILE_CACHE_TTL = 5 * 60 * 1000;

interface CachedProfile {
  session: Session | null;
  user: AuthenticatedUser | null;
  partner: Partner | null;
  timestamp: number;
}

let cached: CachedProfile | null = null;

const DEBUG = !!import.meta.env.VITE_DEBUG_AUTH;

function log(...args: any[]) {
  if (DEBUG) console.debug("[supabaseAuth]", ...args);
}

async function fetchProfileFromDb(session: Session) {
  if (!session) return { user: null, partner: null };
  const userId = session.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `id,email,full_name,role,partner_id,access_level,is_first_login,is_active,partner:partners(id,org_name,partner_type,access_level,commission_rate,onboarding_completed)`,
    )
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    log("fetchProfileFromDb: no profile", profileError);
    return { user: null, partner: null };
  }

  const mappedUser: AuthenticatedUser = {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    partner_id: profile.partner_id,
    access_level: profile.access_level || 0,
    is_first_login: profile.is_first_login ?? false,
    is_active: profile.is_active ?? true,
  };

  const partnerData = Array.isArray(profile.partner)
    ? profile.partner[0]
    : profile.partner;

  const mappedPartner: Partner = partnerData
    ? {
        id: partnerData.id,
        org_name: partnerData.org_name || "",
        partner_type: partnerData.partner_type || "",
        access_level: partnerData.access_level || 0,
        commission_rate: partnerData.commission_rate || 0,
        onboarding_completed: partnerData.onboarding_completed || false,
      }
    : null;

  return { user: mappedUser, partner: mappedPartner };
}

export async function getProfile(forceRefresh = false) {
  try {
    const now = Date.now();
    if (!forceRefresh && cached && now - cached.timestamp < PROFILE_CACHE_TTL) {
      log("getProfile: returning cached");
      return {
        session: cached.session,
        user: cached.user,
        partner: cached.partner,
      };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      cached = null;
      log("getProfile: no session");
      return { session: null, user: null, partner: null };
    }

    const { user, partner } = await fetchProfileFromDb(session);

    cached = { session, user, partner, timestamp: now };
    log("getProfile: fetched and cached", { user, partner });
    return { session, user, partner };
  } catch (err) {
    console.error("getProfile error", err);
    cached = null;
    return { session: null, user: null, partner: null };
  }
}

export function invalidateCache() {
  log("invalidateCache");
  cached = null;
}

export function subscribeAuth(
  cb: (event: string, session: Session | null) => void,
) {
  log("subscribeAuth: subscribing");
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    log("auth event", event);
    if (event === "SIGNED_IN") {
      invalidateCache();
      cb(event, session);
    } else if (event === "TOKEN_REFRESHED") {
      invalidateCache();
      cb(event, session);
    } else if (event === "SIGNED_OUT") {
      invalidateCache();
      cb(event, null);
    } else {
      cb(event, session);
    }
  });

  return {
    unsubscribe: () => {
      log("subscribeAuth: unsubscribing");
      try {
        data?.subscription?.unsubscribe();
      } catch (e) {
        // swallow
      }
    },
  };
}

export async function signOut() {
  invalidateCache();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function refetchProfile() {
  return getProfile(true);
}

export async function getAuthUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      log("getAuthUser: error", error);
      return null;
    }
    return data?.user || null;
  } catch (err) {
    console.error("getAuthUser error", err);
    return null;
  }
}

export default {
  getProfile,
  subscribeAuth,
  invalidateCache,
  signOut,
  refetchProfile,
  getAuthUser,
};
