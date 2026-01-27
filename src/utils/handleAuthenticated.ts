import type { AuthenticatedUser } from "../types/auth.types";
import { supabase } from "../lib/supabase";

export default async function handleAuthenticated(): Promise<AuthenticatedUser | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Try to fetch profile from `users` table by auth_id
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (error || !profile) {
      return null;
    }

    // Map profile to AuthenticatedUser shape expected elsewhere
    const mapped: AuthenticatedUser = {
      id: profile.id as number,
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      email: profile.email || user.email || "",
      phone_number: profile.phone || "",
      username: profile.username || "",
      email_verified_at: profile.email_verified_at || null,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: profile.updated_at || new Date().toISOString(),
      is_first_login: profile.is_first_login || false,
    };

    return mapped;
  } catch (err) {
    console.error("❌ Error checking authentication:", err);
    return null;
  }
}
