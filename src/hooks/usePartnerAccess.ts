import { useAuth } from "./useAuth";

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

  const partnerType: string | null = (partner as any)?.partner_type || null;
  const accessLevel: number | null = (partner as any)?.access_level || null;
  const commissionRate: number | null =
    (partner as any)?.commission_rate || null;
  const userRole: string | null = (user as any)?.role || null;

  const getAvailableSections = (): string[] => {
    if (
      userRole === "admin_partner" ||
      userRole === "super_admin" ||
      userRole === "partner_admin"
    ) {
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

    if (accessLevel !== null && SECTION_ACCESS_BY_LEVEL[accessLevel]) {
      return SECTION_ACCESS_BY_LEVEL[accessLevel];
    }

    if (partnerType && SECTION_ACCESS_BY_PARTNER_TYPE[partnerType]) {
      return SECTION_ACCESS_BY_PARTNER_TYPE[partnerType];
    }

    return SECTION_ACCESS_BY_PARTNER_TYPE.affiliate;
  };

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
