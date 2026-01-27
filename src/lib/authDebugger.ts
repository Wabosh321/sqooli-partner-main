export interface AuthDebugInfo {
  timestamp: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  partnerId: string | null;
  partnerName: string | null;
  partnerType: string | null;
  partnerStatus: string | null;
  accessLevel: number | null;
  permissions: string[];
  canAccessDashboard: boolean;
  resolvedSections: string[];
  denyReason: string | null;
}

/**
 * Create a structured debug record for authorization analysis
 */
export function createAuthDebugRecord(
  user: any,
  partner: any,
  permissions: any[],
  canAccessDashboard: boolean,
  resolvedSections: string[],
  denyReason: string | null = null
): AuthDebugInfo {
  return {
    timestamp: new Date().toISOString(),
    userId: user?.id || null,
    userEmail: user?.email || null,
    userRole: user?.role || null,
    partnerId: partner?.id || null,
    partnerName: partner?.name || null,
    partnerType: partner?.partner_type || null,
    partnerStatus: partner?.status || null,
    accessLevel: partner?.access_level || null,
    permissions: permissions?.map((p) => p.key || p.category) || [],
    canAccessDashboard,
    resolvedSections,
    denyReason,
  };
}

/**
 * Log authorization check with structured data
 */
export function logAuthorizationCheck(
  component: string,
  record: AuthDebugInfo,
  allowLog: boolean = true
) {
  if (!allowLog || !import.meta.env.DEV) {
    return;
  }

  console.group(`🔐 [${component}] Authorization Check`);
  console.table({
    'User ID': record.userId,
    'User Email': record.userEmail,
    'User Role': record.userRole,
    'Partner ID': record.partnerId,
    'Partner Name': record.partnerName,
    'Partner Type': record.partnerType,
    'Partner Status': record.partnerStatus,
    'Access Level': record.accessLevel,
    'Permissions': record.permissions.join(', '),
    'Can Access Dashboard': record.canAccessDashboard,
    'Resolved Sections': record.resolvedSections.join(', '),
    'Deny Reason': record.denyReason || '—',
  });
  console.groupEnd();

  // Store in sessionStorage for debugging
  try {
    const logs = JSON.parse(sessionStorage.getItem('auth_debug_logs') || '[]');
    logs.push({
      component,
      ...record,
    });
    // Keep last 50 records
    sessionStorage.setItem('auth_debug_logs', JSON.stringify(logs.slice(-50)));
  } catch (e) {
    // Silently fail if sessionStorage not available
  }
}

/**
 * Retrieve all stored authorization logs (for debugging)
 */
export function getStoredAuthLogs(): any[] {
  try {
    return JSON.parse(sessionStorage.getItem('auth_debug_logs') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear stored authorization logs
 */
export function clearAuthLogs() {
  try {
    sessionStorage.removeItem('auth_debug_logs');
  } catch {
    // Silently fail
  }
}
