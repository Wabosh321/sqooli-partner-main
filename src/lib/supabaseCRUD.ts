import type { PostgrestError } from '@supabase/supabase-js';

// ========================================================================
// TYPE DEFINITIONS (re-exported)
// ========================================================================

export interface SupabaseResponse<T = any> {
  data: T | null;
  error: any | null; // Loosened to accept any error type
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

// ========================================================================
// RE-EXPORTS FROM ALL MODULES
// ========================================================================

// Generic Helpers
export {
  listTable,
  getById,
  insertRow,
  insertBatch,
  updateRow,
  deleteRow,
} from './modules/genericHelpers';

// Convex ID Support
export {
  findByConvexId,
  upsertWithConvexId,
  upsertWithConvexIdRelaxed,
} from './modules/convexIdSupport';

// Partners
export {
  listPartners,
  getPartner,
  getPartnerByEmail,
  createPartner,
  updatePartner,
  deletePartner,
} from './modules/partnersCRUD';

// Users
export {
  listUsers,
  getUser,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
} from './modules/usersCRUD';

// Curricula
export {
  listCurricula,
  getCurriculum,
  createCurriculum,
  updateCurriculum,
} from './modules/curriculaCRUD';

// Subjects
export {
  listSubjects,
  getSubject,
  createSubject,
} from './modules/subjectsCRUD';

// Programs
export {
  listPrograms,
  getProgram,
  createProgram,
  updateProgram,
} from './modules/programsCRUD';

// Campaigns
export {
  listCampaigns,
  getCampaign,
  getCampaignsByPartner,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from './modules/campaignsCRUD';

// Enrollments
export {
  listEnrollments,
  getEnrollment,
  getEnrollmentsByCampaign,
  createEnrollment,
} from './modules/enrollmentsCRUD';

// Wallets
export {
  listWallets,
  getWallet,
  getWalletByPartnerId,
  createWallet,
  updateWallet,
} from './modules/walletsCRUD';

// Transactions
export {
  listTransactions,
  getTransaction,
  getTransactionsByWallet,
  createTransaction,
} from './modules/transactionsCRUD';

// Withdrawals
export {
  listWithdrawals,
  getWithdrawal,
  getWithdrawalsByPartner,
  createWithdrawal,
  updateWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
} from './modules/withdrawalsCRUD';

// Notifications
export {
  listNotifications,
  getNotification,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
} from './modules/notificationsCRUD';

// Analytics
export {
  listPartnerRevenue,
  getRevenueByPartner,
  createPartnerRevenue,
  getPartnerEarningsSummary,
  getSystemEarningsTimeline,
  getTopEarningPartners,
} from './modules/analyticsCRUD';

// Permissions
export {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from './modules/permissionsCRUD';

// Audit
export {
  createActivityLog,
  getActivityLogs,
} from './modules/auditCRUD';

// ========================================================================
// DEFAULT EXPORT (for backward compatibility)
// ========================================================================

export default {
  // Generic
  listTable: (await import('./modules/genericHelpers')).listTable,
  getById: (await import('./modules/genericHelpers')).getById,
  insertRow: (await import('./modules/genericHelpers')).insertRow,
  insertBatch: (await import('./modules/genericHelpers')).insertBatch,
  updateRow: (await import('./modules/genericHelpers')).updateRow,
  deleteRow: (await import('./modules/genericHelpers')).deleteRow,
  findByConvexId: (await import('./modules/convexIdSupport')).findByConvexId,
  upsertWithConvexId: (await import('./modules/convexIdSupport')).upsertWithConvexId,

  // Partners
  listPartners: (await import('./modules/partnersCRUD')).listPartners,
  getPartner: (await import('./modules/partnersCRUD')).getPartner,
  getPartnerByEmail: (await import('./modules/partnersCRUD')).getPartnerByEmail,
  createPartner: (await import('./modules/partnersCRUD')).createPartner,
  updatePartner: (await import('./modules/partnersCRUD')).updatePartner,
  deletePartner: (await import('./modules/partnersCRUD')).deletePartner,

  // Users
  listUsers: (await import('./modules/usersCRUD')).listUsers,
  getUser: (await import('./modules/usersCRUD')).getUser,
  getUserByEmail: (await import('./modules/usersCRUD')).getUserByEmail,
  createUser: (await import('./modules/usersCRUD')).createUser,
  updateUser: (await import('./modules/usersCRUD')).updateUser,
  deleteUser: (await import('./modules/usersCRUD')).deleteUser,

  // Curricula
  listCurricula: (await import('./modules/curriculaCRUD')).listCurricula,
  getCurriculum: (await import('./modules/curriculaCRUD')).getCurriculum,
  createCurriculum: (await import('./modules/curriculaCRUD')).createCurriculum,
  updateCurriculum: (await import('./modules/curriculaCRUD')).updateCurriculum,

  // Subjects
  listSubjects: (await import('./modules/subjectsCRUD')).listSubjects,
  getSubject: (await import('./modules/subjectsCRUD')).getSubject,
  createSubject: (await import('./modules/subjectsCRUD')).createSubject,

  // Programs
  listPrograms: (await import('./modules/programsCRUD')).listPrograms,
  getProgram: (await import('./modules/programsCRUD')).getProgram,
  createProgram: (await import('./modules/programsCRUD')).createProgram,
  updateProgram: (await import('./modules/programsCRUD')).updateProgram,

  // Campaigns
  listCampaigns: (await import('./modules/campaignsCRUD')).listCampaigns,
  getCampaign: (await import('./modules/campaignsCRUD')).getCampaign,
  getCampaignsByPartner: (await import('./modules/campaignsCRUD')).getCampaignsByPartner,
  createCampaign: (await import('./modules/campaignsCRUD')).createCampaign,
  updateCampaign: (await import('./modules/campaignsCRUD')).updateCampaign,
  deleteCampaign: (await import('./modules/campaignsCRUD')).deleteCampaign,

  // Enrollments
  listEnrollments: (await import('./modules/enrollmentsCRUD')).listEnrollments,
  getEnrollment: (await import('./modules/enrollmentsCRUD')).getEnrollment,
  getEnrollmentsByCampaign: (await import('./modules/enrollmentsCRUD')).getEnrollmentsByCampaign,
  createEnrollment: (await import('./modules/enrollmentsCRUD')).createEnrollment,

  // Wallets
  listWallets: (await import('./modules/walletsCRUD')).listWallets,
  getWallet: (await import('./modules/walletsCRUD')).getWallet,
  getWalletByPartnerId: (await import('./modules/walletsCRUD')).getWalletByPartnerId,
  createWallet: (await import('./modules/walletsCRUD')).createWallet,
  updateWallet: (await import('./modules/walletsCRUD')).updateWallet,

  // Transactions
  listTransactions: (await import('./modules/transactionsCRUD')).listTransactions,
  getTransaction: (await import('./modules/transactionsCRUD')).getTransaction,
  getTransactionsByWallet: (await import('./modules/transactionsCRUD')).getTransactionsByWallet,
  createTransaction: (await import('./modules/transactionsCRUD')).createTransaction,

  // Withdrawals
  listWithdrawals: (await import('./modules/withdrawalsCRUD')).listWithdrawals,
  getWithdrawal: (await import('./modules/withdrawalsCRUD')).getWithdrawal,
  getWithdrawalsByPartner: (await import('./modules/withdrawalsCRUD')).getWithdrawalsByPartner,
  createWithdrawal: (await import('./modules/withdrawalsCRUD')).createWithdrawal,
  updateWithdrawal: (await import('./modules/withdrawalsCRUD')).updateWithdrawal,
  approveWithdrawal: (await import('./modules/withdrawalsCRUD')).approveWithdrawal,
  rejectWithdrawal: (await import('./modules/withdrawalsCRUD')).rejectWithdrawal,

  // Notifications
  listNotifications: (await import('./modules/notificationsCRUD')).listNotifications,
  getNotification: (await import('./modules/notificationsCRUD')).getNotification,
  getUnreadCount: (await import('./modules/notificationsCRUD')).getUnreadCount,
  createNotification: (await import('./modules/notificationsCRUD')).createNotification,
  markAsRead: (await import('./modules/notificationsCRUD')).markAsRead,
  markAllAsRead: (await import('./modules/notificationsCRUD')).markAllAsRead,
  deleteNotification: (await import('./modules/notificationsCRUD')).deleteNotification,
  deleteReadNotifications: (await import('./modules/notificationsCRUD')).deleteReadNotifications,

  // Analytics
  listPartnerRevenue: (await import('./modules/analyticsCRUD')).listPartnerRevenue,
  getRevenueByPartner: (await import('./modules/analyticsCRUD')).getRevenueByPartner,
  createPartnerRevenue: (await import('./modules/analyticsCRUD')).createPartnerRevenue,
  getPartnerEarningsSummary: (await import('./modules/analyticsCRUD')).getPartnerEarningsSummary,
  getSystemEarningsTimeline: (await import('./modules/analyticsCRUD')).getSystemEarningsTimeline,
  getTopEarningPartners: (await import('./modules/analyticsCRUD')).getTopEarningPartners,

  // Permissions
  getPermissions: (await import('./modules/permissionsCRUD')).getPermissions,
  createPermission: (await import('./modules/permissionsCRUD')).createPermission,
  updatePermission: (await import('./modules/permissionsCRUD')).updatePermission,
  deletePermission: (await import('./modules/permissionsCRUD')).deletePermission,

  // Audit
  createActivityLog: (await import('./modules/auditCRUD')).createActivityLog,
  getActivityLogs: (await import('./modules/auditCRUD')).getActivityLogs,
};
