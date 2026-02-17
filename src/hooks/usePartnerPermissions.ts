import { useAuth } from "./useAuth";
import {
  PartnerTypeSlug,
  PartnerRole,
  PartnerPermission,
  ADMIN_ROLES_FOR_PARTNER_TYPE,
  type DashboardSection,
  type PartnerWithType,
} from "../types/partner.types";
import resolveSidebarSections from "../components/ui/sidebar/resolveSidebarSections";

export interface UsePartnerPermissionsReturn {
  partner: PartnerWithType | null;
  partnerType: PartnerTypeSlug | null;
  accessLevel: number; // 0-100
  commissionRate: number;
  hasPermission: (permission: PartnerPermission) => boolean;
  hasRole: (role: PartnerRole) => boolean;
  canAccessSection: (section: DashboardSection) => boolean;
  getAvailableSections: () => DashboardSection[];
  isPartnerAdmin: () => boolean;
  isMediaPartner: () => boolean;
  isBeneficiaryPartner: () => boolean;
}

export function usePartnerPermissions(): UsePartnerPermissionsReturn {
  const { partner, user } = useAuth();

  // Get partner type - handle both direct partner_type field and nested relationship
  const partnerType: PartnerTypeSlug | null = ((partner as any)?.partner_type
    ?.slug ||
    (partner as any)?.partner_type ||
    null) as PartnerTypeSlug | null;

  // Get user's partner role from user.partner_role field
  const userPartnerRole: PartnerRole | null =
    (user?.partner_role as PartnerRole) || null;

  // ============================================================================
  // PERMISSION CHECKS
  // ============================================================================

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: PartnerPermission): boolean => {
    // Permission-level checks live in upper-level PermissionProvider/resolver.
    // At partner-permission hook level, fall back to simple membership: if partner type exists allow partner-type default permissions.
    if (!partnerType) return false;
    // Conservative default: allow if section is visible for partner type
    const resolver = resolveSidebarSections({
      partnerType: partnerType as any,
    });
    return (
      resolver.visibleSections.includes(permission as unknown as string) ||
      false
    );
  };

  /**
   * Check if user has a specific partner role
   */
  const hasRole = (role: PartnerRole): boolean => {
    if (!userPartnerRole) return false;
    return userPartnerRole === role;
  };

  /**
   * Check if user can access a specific dashboard section
   */
  const canAccessSection = (section: DashboardSection): boolean => {
    if (!partnerType) return false;
    const resolver = resolveSidebarSections({
      partnerType: partnerType as any,
    });
    return resolver.isVisible(section as string);
  };

  /**
   * Get all available dashboard sections for this partner type
   */
  const getAvailableSections = (): DashboardSection[] => {
    if (!partnerType) return [];
    const resolver = resolveSidebarSections({
      partnerType: partnerType as any,
    });
    return resolver.visibleSections as DashboardSection[];
  };

  /**
   * Check if user is an admin for their partner type
   */
  const isPartnerAdmin = (): boolean => {
    if (!partnerType || !userPartnerRole) return false;

    const adminRoles = ADMIN_ROLES_FOR_PARTNER_TYPE[partnerType];
    return adminRoles?.includes(userPartnerRole) ?? false;
  };

  // ============================================================================
  // PARTNER TYPE CHECKS
  // ============================================================================

  const isMediaPartner = (): boolean => partnerType === PartnerTypeSlug.MEDIA;
  const isBeneficiaryPartner = (): boolean =>
    partnerType === PartnerTypeSlug.BENEFICIARY;

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    partner: (partner as any as PartnerWithType) || null,
    partnerType,
    accessLevel: (partner as any)?.access_level || 0,
    commissionRate: (partner as any)?.commission_rate || 0,
    hasPermission,
    hasRole,
    canAccessSection,
    getAvailableSections,
    isPartnerAdmin,
    isMediaPartner,
    isBeneficiaryPartner,
  };
}
