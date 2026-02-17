import { useAuth } from "./useAuth";
import resolveSidebarSections from "../components/ui/sidebar/resolveSidebarSections";

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
  canAccessTasks: boolean;
  canAccessBeneficiaries: boolean;
  canAccessSponsorships: boolean;
  canAccessSection: (section: string) => boolean;
  isSectionAllowed: (section: string) => boolean;
  isSectionLocked: (section: string) => boolean;
  getAvailableSections: () => string[];
}

export function usePartnerAccess(): PartnerAccessConfig {
  const { partner, user } = useAuth();

  const partnerType: string | null = (partner as any)?.partner_type || null;
  const accessLevel: number | null = (partner as any)?.access_level || null;
  const commissionRate: number | null =
    (partner as any)?.commission_rate || null;
  const userRole: string | null = (user as any)?.role || null;

  const partnerFlags = {
    onboarding_completed: (partner as any)?.onboarding_completed ?? true,
    wallet_setup_completed: (partner as any)?.wallet_setup_completed ?? false,
    campaign_created: (partner as any)?.campaign_created ?? false,
  };

  const resolver = resolveSidebarSections({
    partnerType: (partnerType as any) || undefined,
    accessLevel: accessLevel ?? undefined,
    userRole: userRole ?? undefined,
    permissions: null,
    partnerFlags,
    fallback: undefined,
  });

  const getAvailableSections = (): string[] => resolver.visibleSections;

  const canAccessSection = (section: string): boolean =>
    resolver.isVisible(section);
  const isSectionAllowed = (section: string): boolean =>
    resolver.isAllowed(section);
  const isSectionLocked = (section: string): boolean =>
    resolver.isLocked(section);

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
    canAccessTasks: canAccessSection("tasks"),
    canAccessBeneficiaries: canAccessSection("beneficiaries"),
    canAccessSponsorships: canAccessSection("sponsorships"),
    canAccessSection,
    isSectionAllowed,
    isSectionLocked,
    getAvailableSections,
  };
}
