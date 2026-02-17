import type { Partner, AuthenticatedUser } from "../../../types/auth.types";

export type PartnerType = "media" | "beneficiary";

export interface HeaderProps {
  title?: string;
  isDashboard?: boolean;
  mobileDrawerOpen?: boolean;
  onMobileDrawerToggle?: (open: boolean) => void;
}

export interface HeaderStateContextValue {
  user: AuthenticatedUser | null;
  loading: boolean;
  partner: Partner | null;
  fullName: string;
  email: string;
  initials: string;
  userRole: string | null;
  userExtension: string | null;
  onLogout: () => Promise<void>;
}

export interface PartnerBadgeProps {
  partnerType: PartnerType | null | undefined;
}

export interface HeaderLeftProps {
  title: string;
  isDashboard: boolean;
  isMobile: boolean;
  mobileDrawerOpen: boolean;
  onMobileDrawerToggle?: (open: boolean) => void;
  partnerType: PartnerType | null | undefined;
}

export interface HeaderRightProps {
  partnerId: string;
  fullName: string;
  email: string;
  initials: string;
  userRole: string | null;
  userExtension: string | null;
  onLogout: () => Promise<void>;
}

export interface HeaderContainerProps {
  children: React.ReactNode;
  isMobile: boolean;
}
