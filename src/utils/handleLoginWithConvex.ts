import { supabase } from "../lib/supabase";

export async function handleLoginWithConvex(email: string, password: string, extension?: string) {
  try {
    if (!extension) {
      throw new Error("Extension missing. Cannot identify user.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const session = data.session;
    const authUser = data.user;

    if (!authUser) throw new Error("Invalid login credentials.");

    // Fetch application profile linked to this auth user
    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .limit(1)
      .maybeSingle();
    if (profileErr) throw profileErr;

    if (profile && profile.is_account_activated === false) {
      throw new Error('Account not activated. Contact your partner admin.');
    }

    return {
      success: true,
      message: 'Login successful',
      session,
      user: profile || authUser,
    };
  } catch (error: unknown) {
    console.error('Login failed:', error);
    let message = 'Login failed';
    if (error instanceof Error) message = error.message;
    return { success: false, message };
  }
}
