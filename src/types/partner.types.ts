/**
 * Partner Type System - TypeScript Definitions
 * Defines all partner types, roles, and permissions
 */

// ============================================================================
// PARTNER TYPE DEFINITIONS
// ============================================================================

export enum PartnerTypeSlug {
  AFFILIATE = 'affiliate',
  MEDIA = 'media',
  CORPORATE = 'corporate',
  INSTITUTIONAL = 'institutional',
}

export interface PartnerType {
  id: string;
  name: string;
  slug: PartnerTypeSlug;
  description: string;
  access_level: number; // 0-100 percentage
  default_commission_rate: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PARTNER TYPE CONFIGURATIONS
// ============================================================================

export const PARTNER_TYPE_CONFIG: Record<PartnerTypeSlug, PartnerType> = {
  [PartnerTypeSlug.AFFILIATE]: {
    id: 'affiliate-type',
    name: 'Affiliate Partner',
    slug: PartnerTypeSlug.AFFILIATE,
    description: 'Individual Affiliates & Agents - grassroots distribution',
    access_level: 25,
    default_commission_rate: 5.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  [PartnerTypeSlug.MEDIA]: {
    id: 'media-type',
    name: 'Media Partner',
    slug: PartnerTypeSlug.MEDIA,
    description: 'Radio, Influencers, Content Creators - amplification layer',
    access_level: 35,
    default_commission_rate: 12.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  [PartnerTypeSlug.CORPORATE]: {
    id: 'corporate-type',
    name: 'Corporate Partner',
    slug: PartnerTypeSlug.CORPORATE,
    description: 'B2B Employee Benefits - employee welfare integration',
    access_level: 40,
    default_commission_rate: 0.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  [PartnerTypeSlug.INSTITUTIONAL]: {
    id: 'institutional-type',
    name: 'Institutional Partner',
    slug: PartnerTypeSlug.INSTITUTIONAL,
    description: 'Churches, NGOs, Community Organizations - physical anchors',
    access_level: 45,
    default_commission_rate: 7.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

// ============================================================================
// PARTNER ROLES BY TYPE
// ============================================================================

export enum PartnerRole {
  // Affiliate roles
  AFFILIATE_AGENT = 'affiliate_agent',
  AFFILIATE_MANAGER = 'affiliate_manager',

  // Media roles
  MEDIA_MANAGER = 'media_manager',
  MEDIA_ADMIN = 'media_admin',
  CONTENT_CREATOR = 'content_creator',

  // Corporate roles
  CORPORATE_ADMIN = 'corporate_admin',
  HR_MANAGER = 'hr_manager',
  FINANCE_MANAGER = 'finance_manager',

  // Institutional roles
  HUB_MANAGER = 'hub_manager',
  HUB_ADMIN = 'hub_admin',
  COMMUNITY_COORDINATOR = 'community_coordinator',
}

export const PARTNER_ROLES_BY_TYPE: Record<PartnerTypeSlug, PartnerRole[]> = {
  [PartnerTypeSlug.AFFILIATE]: [
    PartnerRole.AFFILIATE_AGENT,
    PartnerRole.AFFILIATE_MANAGER,
  ],
  [PartnerTypeSlug.MEDIA]: [
    PartnerRole.MEDIA_MANAGER,
    PartnerRole.MEDIA_ADMIN,
    PartnerRole.CONTENT_CREATOR,
  ],
  [PartnerTypeSlug.CORPORATE]: [
    PartnerRole.CORPORATE_ADMIN,
    PartnerRole.HR_MANAGER,
    PartnerRole.FINANCE_MANAGER,
  ],
  [PartnerTypeSlug.INSTITUTIONAL]: [
    PartnerRole.HUB_MANAGER,
    PartnerRole.HUB_ADMIN,
    PartnerRole.COMMUNITY_COORDINATOR,
  ],
};

// ============================================================================
// PERMISSIONS BY PARTNER TYPE
// ============================================================================

export enum PartnerPermission {
  // Common
  TRACK_REFERRALS = 'track_referrals',
  VIEW_EARNINGS = 'view_earnings',
  ACCESS_MARKETING_MATERIALS = 'access_marketing_materials',
  BASIC_ANALYTICS = 'basic_analytics',
  VIEW_REFERRAL_DATA = 'view_referral_data',

  // Media specific
  MANAGE_CAMPAIGNS = 'manage_campaigns',
  VIEW_AUDIENCE_INSIGHTS = 'view_audience_insights',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  VIEW_REVENUE_SHARE = 'view_revenue_share',

  // Corporate specific
  BULK_ENROLLMENT = 'bulk_enrollment',
  USAGE_REPORTS = 'usage_reports',
  DEPARTMENT_REPORTING = 'department_reporting',
  EMPLOYEE_PORTAL = 'employee_portal',
  PAYROLL_INTEGRATION = 'payroll_integration',
  BULK_MANAGEMENT = 'bulk_management',

  // Institutional specific
  MANAGE_HUB = 'manage_hub',
  ENROLL_MEMBERS = 'enroll_members',
  TRACK_PERFORMANCE = 'track_performance',
  ACCESS_RESOURCES = 'access_resources',
  IMPACT_REPORTS = 'impact_reports',
  COORDINATOR_MANAGEMENT = 'coordinator_management',
  COMMUNITY_OUTREACH = 'community_outreach',
}

export const PERMISSIONS_BY_PARTNER_TYPE: Record<PartnerTypeSlug, PartnerPermission[]> = {
  [PartnerTypeSlug.AFFILIATE]: [
    PartnerPermission.TRACK_REFERRALS,
    PartnerPermission.VIEW_EARNINGS,
    PartnerPermission.ACCESS_MARKETING_MATERIALS,
    PartnerPermission.BASIC_ANALYTICS,
    PartnerPermission.VIEW_REFERRAL_DATA,
  ],
  [PartnerTypeSlug.MEDIA]: [
    PartnerPermission.TRACK_REFERRALS,
    PartnerPermission.VIEW_EARNINGS,
    PartnerPermission.ACCESS_MARKETING_MATERIALS,
    PartnerPermission.MANAGE_CAMPAIGNS,
    PartnerPermission.VIEW_AUDIENCE_INSIGHTS,
    PartnerPermission.ADVANCED_ANALYTICS,
    PartnerPermission.VIEW_REFERRAL_DATA,
    PartnerPermission.VIEW_REVENUE_SHARE,
  ],
  [PartnerTypeSlug.CORPORATE]: [
    PartnerPermission.BULK_ENROLLMENT,
    PartnerPermission.VIEW_EARNINGS,
    PartnerPermission.ADVANCED_ANALYTICS,
    PartnerPermission.USAGE_REPORTS,
    PartnerPermission.DEPARTMENT_REPORTING,
    PartnerPermission.EMPLOYEE_PORTAL,
    PartnerPermission.PAYROLL_INTEGRATION,
    PartnerPermission.BULK_MANAGEMENT,
  ],
  [PartnerTypeSlug.INSTITUTIONAL]: [
    PartnerPermission.MANAGE_HUB,
    PartnerPermission.ENROLL_MEMBERS,
    PartnerPermission.TRACK_PERFORMANCE,
    PartnerPermission.ACCESS_RESOURCES,
    PartnerPermission.IMPACT_REPORTS,
    PartnerPermission.COORDINATOR_MANAGEMENT,
    PartnerPermission.ADVANCED_ANALYTICS,
    PartnerPermission.VIEW_EARNINGS,
    PartnerPermission.COMMUNITY_OUTREACH,
  ],
};

// ============================================================================
// PERMISSION ADMIN ROLES (who can grant permissions)
// ============================================================================

export const ADMIN_ROLES_FOR_PARTNER_TYPE: Record<PartnerTypeSlug, PartnerRole[]> = {
  [PartnerTypeSlug.AFFILIATE]: [PartnerRole.AFFILIATE_MANAGER],
  [PartnerTypeSlug.MEDIA]: [PartnerRole.MEDIA_ADMIN],
  [PartnerTypeSlug.CORPORATE]: [PartnerRole.CORPORATE_ADMIN],
  [PartnerTypeSlug.INSTITUTIONAL]: [PartnerRole.HUB_ADMIN],
};

// ============================================================================
// PARTNER DASHBOARD SECTIONS BY TYPE
// ============================================================================

export type DashboardSection =
  | 'campaigns'
  | 'wallet'
  | 'reports'
  | 'users'
  | 'programs'
  | 'settings'
  | 'analytics'
  | 'bulk_management'
  | 'community'
  | 'hub_operations';

export const DASHBOARD_SECTIONS_BY_PARTNER_TYPE: Record<PartnerTypeSlug, DashboardSection[]> = {
  [PartnerTypeSlug.AFFILIATE]: [
    'wallet',
    'analytics',
    'settings',
  ],
  [PartnerTypeSlug.MEDIA]: [
    'campaigns',
    'wallet',
    'reports',
    'analytics',
    'settings',
  ],
  [PartnerTypeSlug.CORPORATE]: [
    'bulk_management',
    'reports',
    'analytics',
    'users',
    'settings',
  ],
  [PartnerTypeSlug.INSTITUTIONAL]: [
    'hub_operations',
    'community',
    'reports',
    'analytics',
    'wallet',
    'programs',
    'settings',
  ],
};

// ============================================================================
// EXTENDED PARTNER INTERFACE
// ============================================================================

export interface PartnerWithType {
  id: string;
  user_id: string;
  org_name: string;
  org_email: string;
  org_phone: string;
  description?: string;
  logo_url?: string;
  status: string;
  
  // Partner type fields
  partner_type: PartnerTypeSlug;
  access_level: number;
  commission_rate: number;
  
  // Relationships
  active_users?: number;
  total_referrals?: number;
  total_earnings?: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PARTNER USER INTERFACE (for team members within a partner)
// ============================================================================

export interface PartnerUser {
  id: string;
  partner_id: string;
  user_id: string;
  role: PartnerRole;
  permissions: PartnerPermission[];
  status: 'active' | 'inactive';
  invited_at: string;
  created_at: string;
  updated_at: string;
}
