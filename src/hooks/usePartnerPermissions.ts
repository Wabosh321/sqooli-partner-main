import { useAuth } from './useAuth';
import { 
  PartnerTypeSlug, 
  PartnerRole,
  PartnerPermission,
  PERMISSIONS_BY_PARTNER_TYPE,
  DASHBOARD_SECTIONS_BY_PARTNER_TYPE,
  ADMIN_ROLES_FOR_PARTNER_TYPE,
  type DashboardSection,
  type PartnerWithType,
} from '../types/partner.types';

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
  isCorporatePartner: () => boolean;
  isInstitutionalPartner: () => boolean;
  isAffiliatePartner: () => boolean;
}

export function usePartnerPermissions(): UsePartnerPermissionsReturn {
  const { partner, user } = useAuth();

  // Get partner type - handle both direct partner_type field and nested relationship
  const partnerType: PartnerTypeSlug | null = (
    (partner as any)?.partner_type?.slug || 
    (partner as any)?.partner_type || 
    null
  ) as PartnerTypeSlug | null;

  // Get user's partner role from user.partner_role field
  const userPartnerRole: PartnerRole | null = (user?.partner_role as PartnerRole) || null;

  // ============================================================================
  // PERMISSION CHECKS
  // ============================================================================

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: PartnerPermission): boolean => {
    if (!partnerType) return false;

    const typePermissions = PERMISSIONS_BY_PARTNER_TYPE[partnerType];
    return typePermissions?.includes(permission) ?? false;
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

    const availableSections = DASHBOARD_SECTIONS_BY_PARTNER_TYPE[partnerType];
    return availableSections?.includes(section) ?? false;
  };

  /**
   * Get all available dashboard sections for this partner type
   */
  const getAvailableSections = (): DashboardSection[] => {
    if (!partnerType) return [];
    return DASHBOARD_SECTIONS_BY_PARTNER_TYPE[partnerType] || [];
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
  const isCorporatePartner = (): boolean => partnerType === PartnerTypeSlug.CORPORATE;
  const isInstitutionalPartner = (): boolean => partnerType === PartnerTypeSlug.INSTITUTIONAL;
  const isAffiliatePartner = (): boolean => partnerType === PartnerTypeSlug.AFFILIATE;

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
    isCorporatePartner,
    isInstitutionalPartner,
    isAffiliatePartner,
  };
}
