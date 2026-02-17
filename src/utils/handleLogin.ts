import type { LoginFormData, LoginValidationErrors } from "../types/auth.types";
import { handleSignIn } from "./handleAuthWithSupabase";
import { getLogger } from "../integrations/logger-setup";

const logger = getLogger();

export const validateLoginData = (
  data: LoginFormData,
): LoginValidationErrors => {
  const errors: LoginValidationErrors = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.password) {
    errors.password = "Password is required";
  } else if (data.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  return errors;
};

/**
 * Gets cookie value by name.
 * Note: After migrating to Supabase auth, the app uses token/session-based auth managed
 * by the Supabase client. The Laravel Sanctum CSRF/cookie flow is no longer used.
 */
export const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
};

/**
 * Fetches CSRF cookie from Supabase (no-op).
 * Session management is handled automatically by Supabase Auth.
 */
export const handleGetCSRF = async (): Promise<void> => {
  // No-op for Supabase
  return;
};

export const handleLogin = async (data: LoginFormData) => {
  logger.info("Login validation started", { email: maskEmail(data.email) });

  const errors = validateLoginData(data);
  if (Object.keys(errors).length > 0) {
    logger.warn("Login validation failed", {
      errors: Object.keys(errors),
      email: maskEmail(data.email),
    });
    return { success: false, message: "Please fix the validation errors" };
  }

  try {
    logger.info("Supabase sign-in attempt", {
      email: maskEmail(data.email.trim().toLowerCase()),
    });

    // Use Supabase sign-in
    const result = await handleSignIn(
      data.email.trim().toLowerCase(),
      data.password,
    );

    if (!result.success) {
      logger.error("Login failed", {
        email: maskEmail(data.email),
        error_message: result.error || "Unknown error",
      });
      return { success: false, message: result.error || "Login failed" };
    }

    logger.info("Login successful", {
      userId: result.user?.id,
      email: maskEmail(result.user?.email),
    });

    return { success: true, message: "Login successful!", user: result.user };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    logger.error(
      "Login exception",
      {
        email: maskEmail(data.email),
        error_message: message,
      },
      error as Error,
    );
    console.error("❌ Login error:", message);
    return { success: false, message };
  }
};

/**
 * Mask email for logging purposes
 */
function maskEmail(email: string): string {
  if (!email) return "***REDACTED***";
  const parts = email.split("@");
  if (parts.length !== 2) return "***REDACTED***";
  const localPart = parts[0];
  const masked =
    localPart.charAt(0) +
    "*".repeat(Math.max(0, localPart.length - 2)) +
    (localPart.length > 1 ? localPart.charAt(localPart.length - 1) : "");
  return `${masked}@${parts[1]}`;
}
