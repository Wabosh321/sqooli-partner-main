import { supabase } from "../lib/supabase";

export async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase signOut error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("Logout error:", err);
    return { success: false, error: err };
  }
}
