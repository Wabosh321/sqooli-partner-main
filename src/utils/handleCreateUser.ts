// src/utils/handleCreateUser.ts

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  redeem_code: string;
  metadata: {
    amount_paid: number;
    no_of_lessons: number;
    price_per_lesson: number;
    campaign_id?: string;
  };
}

interface CreateUserResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: { id?: string; email?: string };
    email?: string;
    password?: string;
  };
  error?: string;
}

/**
 * Create user via Supabase
 */
export async function handleCreateUser(
  userData: UserData
): Promise<CreateUserResponse> {
  // Switch to Supabase: create auth user with a temporary password
  // and insert a profile into the `users` table.
  try {
    const { supabase } = await import("../lib/supabase");

    // Generate a temporary random password
    const tempPassword = Math.random().toString(36).slice(-10) + "A1";

    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const callbackUrl = `${appUrl.replace(/\/$/, "")}/auth/callback`;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: userData.email,
        password: tempPassword,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
          },
          emailRedirectTo: callbackUrl,
        },
      }
    );

    if (signUpError) {
      return { success: false, error: signUpError.message };
    }

    const authUser = signUpData.user;

    // Insert profile into users table
    const { error: insertError } = await supabase.from("users").insert({
      auth_id: authUser?.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone_number,
      redeem_code: userData.redeem_code,
      amount_paid: userData.metadata.amount_paid,
      no_of_lessons: userData.metadata.no_of_lessons,
      price_per_lesson: userData.metadata.price_per_lesson,
      campaign_id: userData.metadata.campaign_id || null,
    });

    if (insertError) {
      console.error("Profile creation error:", insertError);
      return { success: false, error: insertError.message };
    }

    return {
      success: true,
      message: "User created via Supabase",
      data: {
        user: authUser ? { id: authUser.id, email: authUser.email } : undefined,
        email: userData.email,
        password: tempPassword,
      },
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Split full name into first_name + last_name
 */
export function parseStudentName(fullName: string): {
  first_name: string;
  last_name: string;
} {
  const nameParts = fullName.trim().split(/\s+/);

  if (nameParts.length === 1) {
    return {
      first_name: nameParts[0],
      last_name: "",
    };
  }

  return {
    first_name: nameParts[0],
    last_name: nameParts.slice(1).join(" "),
  };
}
