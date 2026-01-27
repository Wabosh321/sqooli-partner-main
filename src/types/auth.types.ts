// Auth types (Supabase-only)

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
  confirmPassword: string;
  partnerType?: 'affiliate' | 'media' | 'corporate' | 'institutional'; // Partner type selection
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
  _id?: string; // legacy Convex id (frontend compatibility)
  role?: string;
  partner_role?: string; // User's role within their partner type
  email: string;
  user_metadata?: Record<string, unknown>;
  email_confirmed_at?: string;
  created_at?: string;
}

export interface ConvexUser {
  id: string;
  _id: string;
  email: string;
  role: string; // 'admin', 'member', or 'partner'
  partner_id?: string | null;
  partner_role?: string; // User's role within their partner type
  is_first_login?: boolean;
}

export interface Partner {
  id: string;
  _id?: string; // legacy Convex id (frontend compatibility)
  convex_id?: string | null;
  auth_id?: string;
  name: string;
  email: string;
  phone?: string;
  is_first_login?: boolean;
  permission_ids?: string[];
  username?: string;
  role?: string;
  extension?: string;
  is_active?: boolean;
  is_account_activated?: boolean;
  partner_type?: string; // 'affiliate' | 'media' | 'corporate' | 'institutional'
  // Onboarding tracking
  onboarding_completed?: boolean;
  wallet_setup_completed?: boolean;
  campaign_created?: boolean;
  two_factor_setup_completed?: boolean;
  social_media_added?: boolean;
  users_added?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ConvexPartner extends Partner {
  _id: string;
}

export interface UseAuthReturn {
  user: AuthenticatedUser | null;
  partner: Partner | null;
  loading: boolean;
  error: string | null;
  isFirstLogin: boolean;
  loginMethod: 'supabase' | null;
  refetch?: () => void | Promise<void>;
}

export function getDisplayName(user: AuthenticatedUser | Partner | null): string {
  if (!user) return '';
  if ('name' in user && user.name) return user.name;
  return (user as AuthenticatedUser).email || '';
}

export function getUserInitials(user: AuthenticatedUser | Partner | null): string {
  if (!user) return '';
  const name = 'name' in user && user.name ? user.name : (user as AuthenticatedUser).email || '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getUserEmail(user: AuthenticatedUser | Partner | null): string {
  return user?.email || '';
}

export function getUserRole(user: AuthenticatedUser | Partner | null): string {
  if (!user) return '';
  return (user as Partner).role || '';
}

export function isConvexUser(user: AuthenticatedUser | Partner | null | undefined): boolean {
  if (!user) return false;
  return typeof (user as any)._id === 'string' || typeof (user as any).convex_id === 'string';
}
