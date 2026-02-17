import { supabase } from "../lib/supabase";

export interface SignInResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  error?: string;
}

export const handleSignIn = async (
  email: string,
  password: string,
): Promise<SignInResult> => {
  try {
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (signInError) {
      return {
        success: false,
        error: signInError.message || "Sign-in failed",
      };
    }

    if (!signInData || !signInData.user) {
      return {
        success: false,
        error: "Sign-in failed - no user data",
      };
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return {
        success: false,
        error: "Session could not be established",
      };
    }

    return {
      success: true,
      user: {
        id: signInData.user.id,
        email: signInData.user.email || "",
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return {
      success: false,
      error: message,
    };
  }
};

export const handleSignOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

export const getAuthUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data?.user || null;
};

export const getAuthSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }
  return data?.session || null;
};

export const isUserAuthenticated = async (): Promise<boolean> => {
  const user = await getAuthUser();
  return user !== null;
};
