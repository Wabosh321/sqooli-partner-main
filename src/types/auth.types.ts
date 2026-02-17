// Auth types (Supabase-only)

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
  confirmPassword: string;
  partnerType?: "affiliate" | "media" | "corporate" | "institutional"; // Partner type selection
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  password_confirmation: string;
  partner_type?: string;
}

export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export interface ApiValidationErrors {
  first_name?: string[];
  last_name?: string[];
  email?: string[];
  phone?: string[];
  username?: string[];
  password?: string[];
  password_confirmation?: string[];
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: ApiValidationErrors;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginValidationErrors {
  email?: string;
  password?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: AuthenticatedUser;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
  partner_id?: string | null;
  access_level?: integer;
  permissions?: Record<string, unknown>;
  is_first_login?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ConvexUser {
  id: string;
  email: string;
  role: string;
  partner_id?: string | null;
  is_first_login?: boolean;
}

export interface Partner {
  id: string;
  org_name: string;
  partner_type: string;
  access_level: number;
  commission_rate: number;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UseAuthReturn {
  user: AuthenticatedUser | null;
  partner: Partner | null;
  loading: boolean;
  error: string | null;
  isFirstLogin: boolean;
  loginMethod: "supabase" | null;
  refetch?: () => void | Promise<void>;
}

export function getDisplayName(user: AuthenticatedUser | null): string {
  if (!user) return "";
  return user.email || "";
}

export function getUserEmail(user: AuthenticatedUser | null): string {
  return user?.email || "";
}

export function getUserRole(user: AuthenticatedUser | null): string {
  if (!user) return "";
  return user.role || "";
}
