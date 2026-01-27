/**
 * Supabase Auth Handlers - Frontend Utilities
 * Replaces: src/utils/handleLoginWithConvex.ts
 */

import { supabase } from "../lib/supabase";

/**
 * Sign up with email/password
 * Creates user in Supabase Auth and profile in users table
 */
export async function handleSignUp(email: string, password: string, fullName?: string) {
  try {
    // 1. Create user in Supabase Auth
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const callbackUrl = `${appUrl.replace(/\/$/, "")}/auth/callback`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: callbackUrl,
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error("Sign-up failed: No user returned");
    }

    // 2. Create user profile in public.users table
    const { error: profileError } = await supabase.from("users").insert({
      auth_id: authData.user.id,
      email,
      full_name: fullName,
      role: "user",
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Signup succeeded but profile creation failed - user can retry
      throw new Error("Profile creation failed: " + profileError.message);
    }

    return {
      success: true,
      user: authData.user,
      message: "Sign-up successful! Check your email to confirm.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sign-up failed",
    };
  }
}

/**
 * Sign in with email/password
 * Frontend alternative to Edge Function (direct Supabase Auth)
 */
export async function handleSignIn(email: string, password: string) {
  try {
    console.debug('[handleSignIn] attempting signInWithPassword', { email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Log full response for debugging 400/404 issues
    console.debug('[handleSignIn] supabase response', { data, error });

    if (error) {
      console.error('[handleSignIn] supabase error details', {
        message: error.message,
        cause: (error as any)?.cause,
        status: (error as any)?.status,
        details: (error as any)?.details,
      });
      throw new Error(error.message || 'Supabase sign-in error');
    }

    if (!data || !data.user) {
      console.error('[handleSignIn] no user returned from supabase', { data });
      throw new Error('Login failed: No user returned');
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
}

/**
 * Alternative: Call Edge Function for login (if custom logic needed)
 */
export async function handleLoginWithEdgeFunction(
  email: string,
  password: string
) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(
      `${supabaseUrl}/functions/v1/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Login failed");
    }

    const { session, user } = await response.json();

    // Set session in Supabase client
    if (session) {
      await supabase.auth.setSession(session);
    }

    return {
      success: true,
      user,
      session,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
}

/**
 * Sign out
 */
export async function handleSignOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sign-out failed",
    };
  }
}

/**
 * Get current auth state
 */
export async function getCurrentAuthState() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch user profile
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    return {
      user,
      profile,
    };
  } catch (error) {
    console.error("Error getting auth state:", error);
    return null;
  }
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthChanges(
  callback: (event: string, session: any) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
