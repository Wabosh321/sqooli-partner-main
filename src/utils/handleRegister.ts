import { supabase } from "../lib/supabase";
import type {
  RegisterFormData,
  RegisterResponse,
  ValidationErrors,
} from "../types/auth.types";

export const validateRegistrationData = (
  data: RegisterFormData,
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.firstName.trim()) errors.firstName = "First name is required";
  else if (data.firstName.trim().length < 2)
    errors.firstName = "First name must be at least 2 characters";

  if (!data.lastName.trim()) errors.lastName = "Last name is required";
  else if (data.lastName.trim().length < 2)
    errors.lastName = "Last name must be at least 2 characters";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email.trim()) errors.email = "Email is required";
  else if (!emailRegex.test(data.email))
    errors.email = "Please enter a valid email address";

  const phoneRegex = /^[+]?[\d\s-()]+$/;
  if (!data.phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
  else if (
    !phoneRegex.test(data.phoneNumber) ||
    data.phoneNumber.replace(/\D/g, "").length < 10
  )
    errors.phoneNumber = "Please enter a valid phone number";

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!data.username.trim()) errors.username = "Username is required";
  else if (data.username.length < 3)
    errors.username = "Username must be at least 3 characters";
  else if (!usernameRegex.test(data.username))
    errors.username =
      "Username can only contain letters, numbers, underscores, and hyphens";

  if (!data.password) errors.password = "Password is required";
  else if (data.password.length < 8)
    errors.password = "Password must be at least 8 characters";
  else if (!/(?=.*[a-z])/.test(data.password))
    errors.password = "Password must contain at least one lowercase letter";
  else if (!/(?=.*[A-Z])/.test(data.password))
    errors.password = "Password must contain at least one uppercase letter";
  else if (!/(?=.*\d)/.test(data.password))
    errors.password = "Password must contain at least one number";

  if (!data.confirmPassword)
    errors.confirmPassword = "Please confirm your password";
  else if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Passwords do not match";

  return errors;
};

export const getPasswordStrength = (
  password: string,
): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const strengths = [
    { label: "Very Weak", color: "text-destructive" },
    { label: "Weak", color: "text-chart-3" },
    { label: "Fair", color: "text-chart-3" },
    { label: "Good", color: "text-secondary" },
    { label: "Strong", color: "text-secondary" },
  ];

  return { score, ...strengths[Math.min(score, 4)] };
};

export const handleRegister = async (
  data: RegisterFormData,
): Promise<RegisterResponse> => {
  try {
    const errors = validateRegistrationData(data);
    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Please fix the validation errors" };
    }

    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const callbackUrl = `${appUrl.replace(/\/$/, "")}/auth/callback`;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            username: data.username,
          },
        },
      },
    );

    if (signUpError) {
      return { success: false, message: signUpError.message };
    }

    if (!signUpData || !signUpData.user || !signUpData.user.id) {
      return { success: false, message: "Sign-up did not return user data" };
    }

    sessionStorage.setItem(
      "pendingRegistration",
      JSON.stringify({
        authId: signUpData.user.id,
        email: data.email.trim().toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        username: data.username,
      }),
    );

    return {
      success: true,
      message: "Sign up successful! Check your email to verify your account.",
      data: {
        id: 0,
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone_number: data.phoneNumber.trim(),
        username: data.username.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Network error. Please check your connection and try again.",
    };
  }
};

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
