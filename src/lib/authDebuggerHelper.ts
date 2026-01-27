import { getStoredAuthLogs, clearAuthLogs } from './authDebugger';

declare global {
  interface Window {
    DEBUG_AUTH?: {
      getLogs: () => any[];
      clearLogs: () => void;
      exportCSV: () => string;
      checkAccess: () => void;
    };
  }
}

/**
 * Initialize global debugging helpers (dev only)
 */
export function initAuthDebugger() {
  if (!import.meta.env.DEV) {
    return;
  }

  window.DEBUG_AUTH = {
    /**
     * Get all stored authorization logs
     */
    getLogs: () => {
      const logs = getStoredAuthLogs();
      console.table(logs);
      return logs;
    },

    /**
     * Clear all stored logs
     */
    clearLogs: () => {
      clearAuthLogs();
      console.log('✅ Authorization logs cleared');
    },

    /**
     * Export logs as CSV
     */
    exportCSV: () => {
      const logs = getStoredAuthLogs();
      if (logs.length === 0) {
        console.warn('No logs to export');
        return '';
      }

      const headers = [
        'timestamp',
        'component',
        'userId',
        'userEmail',
        'userRole',
        'partnerId',
        'partnerName',
        'partnerType',
        'partnerStatus',
        'accessLevel',
        'permissions',
        'canAccessDashboard',
        'resolvedSections',
        'denyReason',
      ];

      const rows = logs.map((log) => [
        log.timestamp,
        log.component,
        log.userId,
        log.userEmail,
        log.userRole,
        log.partnerId,
        log.partnerName,
        log.partnerType,
        log.partnerStatus,
        log.accessLevel,
        `"${(log.permissions || []).join(', ')}"`,
        log.canAccessDashboard,
        `"${(log.resolvedSections || []).join(', ')}"`,
        log.denyReason || '',
      ]);

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
      
      // Copy to clipboard and log
      navigator.clipboard.writeText(csv).then(() => {
        console.log('✅ CSV copied to clipboard');
      });

      return csv;
    },

    /**
     * Check current authorization status
     */
    checkAccess: () => {
      const logs = getStoredAuthLogs();
      if (logs.length === 0) {
        console.warn('No authorization logs found. Try navigating to a protected section.');
        return;
      }

      const latest = logs[logs.length - 1];
      
      console.group('🔐 Current Authorization Status');
      console.log('User:', {
        id: latest.userId,
        email: latest.userEmail,
        role: latest.userRole,
      });
      console.log('Partner:', {
        id: latest.partnerId,
        name: latest.partnerName,
        type: latest.partnerType,
        status: latest.partnerStatus,
        accessLevel: latest.accessLevel,
      });
      console.log('Access:', {
        canAccessDashboard: latest.canAccessDashboard,
        resolvedSections: latest.resolvedSections,
        denyReason: latest.denyReason || '—',
      });
      console.log('Permissions:', latest.permissions);
      console.groupEnd();

      return latest;
    },
  };

  console.log(
    '%cDebug Authorization Helper Loaded',
    'color: green; font-size: 14px; font-weight: bold;'
  );
  console.log('Use window.DEBUG_AUTH to access helpers:');
  console.log('  - window.DEBUG_AUTH.getLogs()      // View all logs');
  console.log('  - window.DEBUG_AUTH.checkAccess()  // Check current status');
  console.log('  - window.DEBUG_AUTH.exportCSV()    // Export as CSV');
  console.log('  - window.DEBUG_AUTH.clearLogs()    // Clear logs');
}
