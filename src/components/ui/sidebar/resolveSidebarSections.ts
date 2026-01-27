// Pure function to resolve allowed sections for sidebar rendering.
export const SECTION_ACCESS_BY_PARTNER_TYPE: Record<string, string[]> = {
  affiliate: ['dashboard', 'campaigns', 'wallet'],
  media: ['dashboard', 'campaigns', 'wallet', 'reports'],
  corporate: ['dashboard', 'campaigns', 'wallet', 'reports'],
  institutional: ['dashboard', 'campaigns', 'wallet', 'reports', 'users', 'programs', 'settings'],
}

export const SECTION_ACCESS_BY_LEVEL: Record<number, string[]> = {
  0: [],
  25: ['dashboard', 'campaigns', 'wallet'],
  35: ['dashboard', 'campaigns', 'wallet', 'reports'],
  40: ['dashboard', 'campaigns', 'wallet', 'reports'],
  45: ['dashboard', 'campaigns', 'wallet', 'reports', 'users', 'programs', 'settings'],
  100: ['dashboard', 'campaigns', 'wallet', 'reports', 'users', 'programs', 'settings'],
}

export function resolveSidebarSections(opts: { partnerType?: string | null; accessLevel?: number | null; fallback?: string[] } ) {
  const { partnerType, accessLevel, fallback } = opts

  if (partnerType && SECTION_ACCESS_BY_PARTNER_TYPE[partnerType]) {
    return SECTION_ACCESS_BY_PARTNER_TYPE[partnerType]
  }

  if (accessLevel !== null && accessLevel !== undefined && SECTION_ACCESS_BY_LEVEL[accessLevel]) {
    return SECTION_ACCESS_BY_LEVEL[accessLevel]
  }

  return fallback ?? SECTION_ACCESS_BY_PARTNER_TYPE.affiliate
}

export default resolveSidebarSections
