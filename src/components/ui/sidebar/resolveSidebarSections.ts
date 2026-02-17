import { Permission } from "../../../context/PermissionContext";

export type PartnerType = "media" | "beneficiary";

type PartnerFlags = {
  onboarding_completed?: boolean;
  wallet_setup_completed?: boolean;
  campaign_created?: boolean;
};

const SECTION_ACCESS_BY_PARTNER_TYPE: Record<PartnerType, string[]> = {
  media: [
    "dashboard",
    "campaigns",
    "programs",
    "wallet",
    "reports",
    "tasks",
    "settings",
  ],
  beneficiary: [
    "dashboard",
    "beneficiaries",
    "sponsorships",
    "wallet",
    "users",
    "settings",
    "reports",
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
    "settings",
  ],
  100: [
    "dashboard",
    "campaigns",
    "wallet",
    "reports",
    "users",
    "programs",
    "settings",
  ],
};

export interface ResolverResult {
  visibleSections: string[]; // sections that should be shown in sidebar
  allowedSections: string[]; // sections the user is allowed to enter
  isVisible: (key: string) => boolean;
  isAllowed: (key: string) => boolean;
  isLocked: (key: string) => boolean;
  partnerType?: PartnerType | null;
  isMedia: boolean;
  isBeneficiary: boolean;
}

export function resolveSidebarSections(opts: {
  partnerType?: PartnerType | null;
  accessLevel?: number | null;
  userRole?: string | null;
  permissions?: Permission[] | null;
  partnerFlags?: PartnerFlags | null;
  fallback?: string[];
}): ResolverResult {
  const {
    partnerType = null,
    accessLevel = null,
    userRole = null,
    permissions = null,
    partnerFlags = null,
    fallback,
  } = opts || {};

  const isMedia = partnerType === "media";
  const isBeneficiary = partnerType === "beneficiary";

  // Resolve base visible sections from partner type or access level
  let visible: string[] = [];
  if (partnerType && SECTION_ACCESS_BY_PARTNER_TYPE[partnerType]) {
    visible = SECTION_ACCESS_BY_PARTNER_TYPE[partnerType];
  } else if (
    accessLevel !== null &&
    accessLevel !== undefined &&
    SECTION_ACCESS_BY_LEVEL[accessLevel]
  ) {
    visible = SECTION_ACCESS_BY_LEVEL[accessLevel];
  } else {
    visible = fallback ?? SECTION_ACCESS_BY_PARTNER_TYPE.beneficiary;
  }

  // Helper to check permission presence
  const hasPermissionFor = (section: string): boolean => {
    if (!permissions || permissions.length === 0) return false;
    // Exact key match
    if (permissions.some((p) => p.key === `${section}.read`)) return true;
    // Category match
    if (permissions.some((p) => p.category === section)) return true;
    // Full access
    if (
      permissions.some((p) => p.category === "all_access" || p.level === "full")
    )
      return true;
    return false;
  };

  // Determine allowedSections: visible sections filtered by permissions / role
  const allowed: string[] = visible.filter((s) => {
    // super admin / admin partner roles bypass
    if (
      userRole === "super_admin" ||
      userRole === "partner_admin" ||
      userRole === "admin_partner"
    )
      return true;
    // If permissions exist, require permission or category
    if (permissions && permissions.length > 0) {
      return hasPermissionFor(s);
    }
    // Default: allow visible sections when no explicit permissions provided
    return true;
  });

  // Locked sections (onboarding-based locking)
  const lockedUntilWalletAndCampaign = new Set([
    "campaigns",
    "programs",
    "users",
  ]);

  const isLocked = (key: string) => {
    // If section not visible, treat as hidden (not locked)
    if (!visible.includes(key)) return false;

    // If user not allowed, consider it locked
    if (!allowed.includes(key)) return true;

    // Onboarding locks
    if (partnerFlags && partnerFlags.onboarding_completed === false) {
      if (lockedUntilWalletAndCampaign.has(key)) {
        const walletOk = !!partnerFlags.wallet_setup_completed;
        const campaignOk = !!partnerFlags.campaign_created;
        return !(walletOk && campaignOk);
      }
    }

    return false;
  };

  const result: ResolverResult = {
    visibleSections: visible,
    allowedSections: allowed,
    isVisible: (k: string) => visible.includes(k),
    isAllowed: (k: string) => allowed.includes(k),
    isLocked,
    partnerType,
    isMedia,
    isBeneficiary,
  };

  return result;
}

export default resolveSidebarSections;
