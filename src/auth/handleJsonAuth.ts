import { supabase } from "../lib/supabase";

export interface SupabaseProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  username: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface SignInResult {
  success: boolean;
  user?: SupabaseProfile;
  message?: string;
}

export async function handleSupabaseSignIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      return {
        success: false,
        message: error.message || "Invalid email or password",
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: "Sign in failed",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      return {
        success: false,
        message: "Failed to load user profile",
      };
    }

    return {
      success: true,
      user: profile,
      message: "Sign in successful",
    };
  } catch (error) {
    return {
      success: false,
      message: "An error occurred during sign in",
    };
  }
}

export async function getSupabaseAuthUser(): Promise<SupabaseProfile | null> {
  try {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    return profile || null;
  } catch (error) {
    return null;
  }
}

export async function isSupabaseAuthenticated(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    return false;
  }
}

export async function handleSupabaseLogout(): Promise<void> {
  await supabase.auth.signOut();
}
