import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";
import {
  PartnerTypeSlug,
  PartnerRole,
  PartnerPermission,
  PERMISSIONS_BY_PARTNER_TYPE,
  DASHBOARD_SECTIONS_BY_PARTNER_TYPE,
  ADMIN_ROLES_FOR_PARTNER_TYPE,
  type DashboardSection,
} from "../types/partner.types";
import type { Partner } from "../types/auth.types";

export interface UsePartnerPermissionsReturn {
  partner: Partner | null;
  partnerType: PartnerTypeSlug | null;
  accessLevel: number;
  commissionRate: number;
  permissions: any[];
  hasPermission: (permission: PartnerPermission) => boolean;
  hasRole: (role: PartnerRole) => boolean;
  canAccessSection: (section: DashboardSection) => boolean;
  getAvailableSections: () => DashboardSection[];
  isPartnerAdmin: () => boolean;
  isMediaPartner: () => boolean;
  isCorporatePartner: () => boolean;
  isInstitutionalPartner: () => boolean;
  isAffiliatePartner: () => boolean;
  loading: boolean;
}

export function usePartnerPermissions(): UsePartnerPermissionsReturn {
  const { partner, user } = useAuth();
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("permissions")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setPermissions(data?.permissions || []);
      } catch (error) {
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.id]);

  const partnerType: PartnerTypeSlug | null =
    (partner?.partner_type as PartnerTypeSlug) || null;

  const userRole: string | null = user?.role || null;

  const hasPermission = (permission: PartnerPermission): boolean => {
    if (permissions.length > 0) {
      return permissions.some(
        (p) => p.category === permission || p.key === permission,
      );
    }

    if (!partnerType) return false;

    const typePermissions = PERMISSIONS_BY_PARTNER_TYPE[partnerType];
    return typePermissions?.includes(permission) ?? false;
  };

  const hasRole = (role: PartnerRole): boolean => {
    if (!userRole) return false;
    return (userRole as PartnerRole) === role;
  };

  const canAccessSection = (section: DashboardSection): boolean => {
    if (!partnerType) return false;

    const availableSections = DASHBOARD_SECTIONS_BY_PARTNER_TYPE[partnerType];
    return availableSections?.includes(section) ?? false;
  };

  const getAvailableSections = (): DashboardSection[] => {
    if (!partnerType) return [];
    return DASHBOARD_SECTIONS_BY_PARTNER_TYPE[partnerType] || [];
  };

  const isPartnerAdmin = (): boolean => {
    if (!partnerType || !userRole) return false;

    const adminRoles = ADMIN_ROLES_FOR_PARTNER_TYPE[partnerType];
    return adminRoles?.includes(userRole as PartnerRole) ?? false;
  };

  const isMediaPartner = (): boolean => partnerType === PartnerTypeSlug.MEDIA;
  const isCorporatePartner = (): boolean =>
    partnerType === PartnerTypeSlug.CORPORATE;
  const isInstitutionalPartner = (): boolean =>
    partnerType === PartnerTypeSlug.INSTITUTIONAL;
  const isAffiliatePartner = (): boolean =>
    partnerType === PartnerTypeSlug.AFFILIATE;

  return {
    partner,
    partnerType,
    accessLevel: partner?.access_level || 0,
    commissionRate: partner?.commission_rate || 0,
    permissions,
    hasPermission,
    hasRole,
    canAccessSection,
    getAvailableSections,
    isPartnerAdmin,
    isMediaPartner,
    isCorporatePartner,
    isInstitutionalPartner,
    isAffiliatePartner,
    loading,
  };
}
