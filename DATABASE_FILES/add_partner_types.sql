-- ============================================================================
-- PARTNER TYPE SYSTEM - DATABASE MIGRATION
-- ============================================================================

-- Add partner_type column to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'affiliate',
ADD COLUMN IF NOT EXISTS access_level INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 2) DEFAULT 5.00;

-- Create index on partner_type
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(partner_type);

-- ============================================================================
-- PARTNER TYPE ENUM & PERMISSIONS TABLE
-- ============================================================================

-- Create partner_types table (reference data)
CREATE TABLE IF NOT EXISTS partner_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  access_level INTEGER DEFAULT 25,
  default_commission_rate NUMERIC(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert partner type definitions
INSERT INTO partner_types (name, slug, description, access_level, default_commission_rate) VALUES
  ('Affiliate Partner', 'affiliate', 'Individual Affiliates & Agents - grassroots distribution', 25, 5.00),
  ('Media Partner', 'media', 'Radio, Influencers, Content Creators - amplification layer', 35, 12.50),
  ('Corporate Partner', 'corporate', 'B2B Employee Benefits - employee welfare integration', 40, 0.00),
  ('Institutional Partner', 'institutional', 'Churches, NGOs, Community Organizations - physical anchors', 45, 7.50)
ON CONFLICT (slug) DO NOTHING;

-- Create partner_type_permissions table
CREATE TABLE IF NOT EXISTS partner_type_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type_slug TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(partner_type_slug, permission_key),
  FOREIGN KEY (partner_type_slug) REFERENCES partner_types(slug) ON DELETE CASCADE
);

-- Create index on partner_type_slug
CREATE INDEX IF NOT EXISTS idx_partner_type_permissions_slug ON partner_type_permissions(partner_type_slug);

-- ============================================================================
-- INSERT PARTNER TYPE PERMISSIONS
-- ============================================================================

-- AFFILIATE PARTNER PERMISSIONS (25% access)
INSERT INTO partner_type_permissions (partner_type_slug, permission_key, description) VALUES
  ('affiliate', 'track_referrals', 'Track referral links and conversions'),
  ('affiliate', 'view_earnings', 'View commission earnings'),
  ('affiliate', 'access_marketing_materials', 'Access promotional materials'),
  ('affiliate', 'basic_analytics', 'Basic analytics dashboard'),
  ('affiliate', 'view_referral_data', 'View referral tracking data')
ON CONFLICT (partner_type_slug, permission_key) DO NOTHING;

-- MEDIA PARTNER PERMISSIONS (35% access)
INSERT INTO partner_type_permissions (partner_type_slug, permission_key, description) VALUES
  ('media', 'track_referrals', 'Track referral links and conversions'),
  ('media', 'view_earnings', 'View commission earnings'),
  ('media', 'access_marketing_materials', 'Access promotional materials'),
  ('media', 'manage_campaigns', 'Manage campaign content'),
  ('media', 'view_audience_insights', 'View audience insights and analytics'),
  ('media', 'advanced_analytics', 'Advanced analytics dashboard'),
  ('media', 'view_referral_data', 'View referral tracking data'),
  ('media', 'view_revenue_share', 'View revenue share tracking')
ON CONFLICT (partner_type_slug, permission_key) DO NOTHING;

-- CORPORATE PARTNER PERMISSIONS (40% access)
INSERT INTO partner_type_permissions (partner_type_slug, permission_key, description) VALUES
  ('corporate', 'bulk_enrollment', 'Bulk user enrollment & management'),
  ('corporate', 'view_earnings', 'View pricing and subscription info'),
  ('corporate', 'advanced_analytics', 'Corporate analytics dashboard'),
  ('corporate', 'usage_reports', 'Usage & engagement reports'),
  ('corporate', 'department_reporting', 'Department-level reporting'),
  ('corporate', 'employee_portal', 'Employee self-service portal'),
  ('corporate', 'payroll_integration', 'Payroll deduction integration'),
  ('corporate', 'bulk_management', 'Manage bulk enrollments')
ON CONFLICT (partner_type_slug, permission_key) DO NOTHING;

-- INSTITUTIONAL PARTNER PERMISSIONS (45% access)
INSERT INTO partner_type_permissions (partner_type_slug, permission_key, description) VALUES
  ('institutional', 'manage_hub', 'Manage learning hub operations'),
  ('institutional', 'enroll_members', 'Enroll hub members'),
  ('institutional', 'track_performance', 'Track hub performance'),
  ('institutional', 'access_resources', 'Access community resources'),
  ('institutional', 'impact_reports', 'Generate impact reports'),
  ('institutional', 'coordinator_management', 'Coordinate facilitators'),
  ('institutional', 'advanced_analytics', 'Advanced analytics dashboard'),
  ('institutional', 'view_earnings', 'View earnings and commission'),
  ('institutional', 'community_outreach', 'Community outreach tools')
ON CONFLICT (partner_type_slug, permission_key) DO NOTHING;

-- ============================================================================
-- PARTNER TYPE ROLE MAPPING
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_type_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type_slug TEXT NOT NULL,
  role_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(partner_type_slug, role_name),
  FOREIGN KEY (partner_type_slug) REFERENCES partner_types(slug) ON DELETE CASCADE
);

-- Insert role mappings for each partner type
INSERT INTO partner_type_roles (partner_type_slug, role_name, description) VALUES
  -- Affiliate roles
  ('affiliate', 'affiliate_agent', 'Individual affiliate or agent'),
  ('affiliate', 'affiliate_manager', 'Manager of affiliate agents'),
  
  -- Media roles
  ('media', 'media_manager', 'Manager of media campaigns'),
  ('media', 'media_admin', 'Administrator for media partner'),
  ('media', 'content_creator', 'Content creator / influencer'),
  
  -- Corporate roles
  ('corporate', 'corporate_admin', 'Administrator of corporate account'),
  ('corporate', 'hr_manager', 'HR manager handling benefits'),
  ('corporate', 'finance_manager', 'Finance manager for billing'),
  
  -- Institutional roles
  ('institutional', 'hub_manager', 'Manager of learning hub'),
  ('institutional', 'hub_admin', 'Administrator of learning hub'),
  ('institutional', 'community_coordinator', 'Community coordinator')
ON CONFLICT (partner_type_slug, role_name) DO NOTHING;
