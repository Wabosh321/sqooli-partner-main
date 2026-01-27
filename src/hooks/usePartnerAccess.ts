import { useAuth } from "./useAuth";
import { getJsonAuthUser } from "../auth/handleJsonAuth";

export interface PartnerAccessConfig {
  partnerType: string | null;
  accessLevel: number | null;
  commissionRate: number | null;
  canAccessDashboard: boolean;
  canAccessCampaigns: boolean;
  canAccessWallet: boolean;
  canAccessReports: boolean;
  canAccessUsers: boolean;
  canAccessPrograms: boolean;
  canAccessSettings: boolean;
  canAccessSection: (section: string) => boolean;
  getAvailableSections: () => string[];
}

const SECTION_ACCESS_BY_PARTNER_TYPE: Record<string, string[]> = {
  affiliate: ["dashboard", "campaigns", "wallet"],
  media: ["dashboard", "campaigns", "wallet", "reports", "tasks"],
  corporate: ["dashboard", "campaigns", "wallet", "reports"],
  institutional: [
    "dashboard",
    "campaigns",
    "wallet",
    "reports",
    "users",
    "programs",
    "tasks",
    "settings",
  ],
};

const SECTION_ACCESS_BY_LEVEL: Record<number, string[]> = {
  0: [],
  25: ["dashboard", "campaigns", "wallet"],
  35: ["dashboard", "campaigns", "wallet", "reports"],
  40: ["dashboard", "campaigns", "wallet", "reports"],
  45: [
    "dashboard",
    "campaigns",
    "wallet",
    "reports",
    "users",
    "programs",
    "tasks",
    "settings",
  ],
  100: [
    "dashboard",
    "campaigns",
    "wallet",
    "reports",
    "users",
    "programs",
    "tasks",
    "settings",
  ],
};

export function usePartnerAccess(): PartnerAccessConfig {
  const { partner, user } = useAuth();

  // Get partner info from JSON user
  const jsonUser = getJsonAuthUser();

  // Extract partner type and access level
  const partnerType: string | null =
    jsonUser?.partner_type || (partner as any)?.partner_type || null;
  const accessLevel: number | null =
    jsonUser?.access_level || (partner as any)?.access_level || null;
  const commissionRate: number | null =
    (partner as any)?.commission_rate || null;
  const userRole: string | null = jsonUser?.role || (user as any)?.role || null;

  /**
   * Determine available sections based on partner type
   * Falls back to access level if partner type not available
   * NOTE: admin_partner role gets full access regardless of partner_type
   */
  const getAvailableSections = (): string[] => {
    // Priority 1: Admin partner role always gets full access
    if (userRole === "admin_partner" || userRole === "super_admin") {
      return [
        "dashboard",
        "campaigns",
        "wallet",
        "reports",
        "users",
        "programs",
        "tasks",
        "settings",
      ];
    }

    // Priority 2: Check access level (highest access)
    if (accessLevel !== null && SECTION_ACCESS_BY_LEVEL[accessLevel]) {
      return SECTION_ACCESS_BY_LEVEL[accessLevel];
    }

    // Priority 3: Check partner type
    if (partnerType && SECTION_ACCESS_BY_PARTNER_TYPE[partnerType]) {
      return SECTION_ACCESS_BY_PARTNER_TYPE[partnerType];
    }

    // Default: Affiliate access (lowest)
    return SECTION_ACCESS_BY_PARTNER_TYPE.affiliate;
  };

  /**
   * Check if user can access a specific section
   */
  const canAccessSection = (section: string): boolean => {
    const available = getAvailableSections();
    return available.includes(section.toLowerCase());
  };

  const availableSections = getAvailableSections();

  return {
    partnerType,
    accessLevel,
    commissionRate,
    canAccessDashboard: canAccessSection("dashboard"),
    canAccessCampaigns: canAccessSection("campaigns"),
    canAccessWallet: canAccessSection("wallet"),
    canAccessReports: canAccessSection("reports"),
    canAccessUsers: canAccessSection("users"),
    canAccessPrograms: canAccessSection("programs"),
    canAccessSettings: canAccessSection("settings"),
    canAccessSection,
    getAvailableSections,
  };
}
