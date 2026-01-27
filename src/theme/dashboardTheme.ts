/**
 * Dashboard Design System Theme
 * 
 * Centralized design tokens for the dashboard layout and components.
 * Based on pixel-accurate design specification (12-column grid, desktop layout).
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================
export const DashboardColors = {
  // Page & Section Backgrounds
  page_background: ' #F6F7F9',
  section_background: 'transparent',

  
  // Gradients
  wallet_gradient_start: '#5B8DEF',
  wallet_gradient_end: '#6AAEFF',
  campaigns_gradient_start: '#F5E8FF',
  campaigns_gradient_end: '#EEF2FF',
  
  // Text
  text_primary: '#0F172A',
  text_secondary: '#64748B',
  text_muted: '#94A3B8',
  
  // Borders & Dividers
  border_light: '#E5E7EB',
  border_muted: '#E2E8F0',
  divider: '#F1F5F9',
  
  // Component Colors
  primary: '#2563EB',
  primary_light: '#EEF2FF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Icon Colors
  icon_default: '#64748B',
  icon_active: '#2563EB',
} as const;

// ============================================================================
// SPACING SYSTEM
// ============================================================================
export const DashboardSpacing = {
  // Base unit: 4px
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  
  // Named spacing
  page_padding: '24px',
  section_padding: '24px',
  section_padding_compact: '20px',
  section_padding_tight: '16px',
  
  // Grid gap
  grid_gap: '24px',
  grid_gap_compact: '16px',
  
  // Component spacing
  item_spacing: '12px',
  item_gap: '16px',
  icon_size: '36px',
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================
export const DashboardRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================
export const DashboardShadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const DashboardTypography = {
  font_family: '"Inter", system-ui, -apple-system, sans-serif',
  base_font_size: '14px',
  
  // Font sizes
  text_xs: '12px',
  text_sm: '14px',
  text_md: '16px',
  text_lg: '18px',
  text_xl: '20px',
  text_2xl: '24px',
  text_3xl: '32px',
  
  // Font weights
  weight_normal: 400,
  weight_medium: 500,
  weight_semibold: 600,
  weight_bold: 700,
  
  // Line heights
  line_height_tight: 1.25,
  line_height_normal: 1.5,
  line_height_relaxed: 1.75,
} as const;

// ============================================================================
// LAYOUT DIMENSIONS
// ============================================================================
export const DashboardLayout = {
  // Header
  header_height: '64px',
  header_height_mobile: '56px',
  
  // Sidebar
  sidebar_width: '240px',
  sidebar_item_height: '44px',
  sidebar_item_gap: '8px',
  sidebar_padding: '24px 16px',
  
  // Grid columns
  grid_columns: 12,
  max_content_width: '1400px',
  
  // Breakpoints
  breakpoint_sm: '640px',
  breakpoint_md: '768px',
  breakpoint_lg: '1024px',
  breakpoint_xl: '1280px',
} as const;

// ============================================================================
// COMPONENT-SPECIFIC STYLES
// ============================================================================
export const DashboardComponents = {
  // Wallet Card
  wallet_card: {
    grid_column: 'span 8',
    height: '140px',
    background: `linear-gradient(135deg, ${DashboardColors.wallet_gradient_start}, ${DashboardColors.wallet_gradient_end})`,
    border_radius: DashboardRadius.lg,
    padding: DashboardSpacing.lg,
    text_color: '#FFFFFF',
  },
  
  // Upcoming Campaigns Card
  upcoming_campaigns: {
    grid_column: 'span 4',
    background: `linear-gradient(180deg, ${DashboardColors.campaigns_gradient_start}, ${DashboardColors.campaigns_gradient_end})`,
    border_radius: DashboardRadius.lg,
    padding: DashboardSpacing.md,
    item_height: '48px',
  },
  
  // Stats Section
  stats_section: {
    grid_column: 'span 12',
    background: DashboardColors.section_background,
    border_radius: DashboardRadius.lg,
    padding: DashboardSpacing.section_padding_compact,
    display: 'flex',
    justify_content: 'space-between',
  },
  
  // Chart Section
  chart_section: {
    grid_column: 'span 8',
    background: DashboardColors.section_background,
    border_radius: DashboardRadius.lg,
    padding: DashboardSpacing.lg,
    height: '320px',
  },
  
  // Activity Panel
  activity_panel: {
    grid_column: 'span 4',
    background: DashboardColors.section_background,
    border_radius: DashboardRadius.lg,
    padding: DashboardSpacing.md,
    item_gap: DashboardSpacing.item_spacing,
  },
  
  // Button
  button_primary: {
    background: DashboardColors.primary,
    color: '#FFFFFF',
    height: '40px',
    padding: '0 16px',
    border_radius: DashboardRadius.sm,
  },
} as const;

// ============================================================================
// HELPER FUNCTION FOR CSS
// ============================================================================
export const getDashboardThemeCSS = (): string => {
  return `
    :root {
      /* Colors */
      --dashboard-page-bg: ${DashboardColors.page_background};
      --dashboard-section-bg: ${DashboardColors.section_background};
      --dashboard-text-primary: ${DashboardColors.text_primary};
      --dashboard-text-secondary: ${DashboardColors.text_secondary};
      --dashboard-border-light: ${DashboardColors.border_light};
      --dashboard-primary: ${DashboardColors.primary};
      
      /* Spacing */
      --dashboard-spacing-xs: ${DashboardSpacing.xs};
      --dashboard-spacing-sm: ${DashboardSpacing.sm};
      --dashboard-spacing-md: ${DashboardSpacing.md};
      --dashboard-spacing-lg: ${DashboardSpacing.lg};
      
      /* Radius */
      --dashboard-radius-sm: ${DashboardRadius.sm};
      --dashboard-radius-lg: ${DashboardRadius.lg};
      
      /* Layout */
      --dashboard-header-height: ${DashboardLayout.header_height};
      --dashboard-sidebar-width: ${DashboardLayout.sidebar_width};
    }
  `;
};
