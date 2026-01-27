import { createContext } from 'react';
export interface Permission {
  _id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  level: string;
  is_default: boolean;
  created_at: string;
}


export type UserRole = 
  | "super_admin"
  | "partner_admin"
  | "admin_partner"
  | "media_partner"
  | "accountant"
  | "campaign_manager"
  | "viewer"
  | "super_agent"
  | "master_agent"
  | "merchant_admin";

export interface PermissionContextType {
  permissions: Permission[] | null;
  hasPermission: (permissionKey: string) => boolean;
  hasCategory: (category: string) => boolean;
  hasLevel: (level: 'read' | 'write' | 'admin' | 'full') => boolean;
  canRead: (category: string) => boolean;
  canWrite: (category: string) => boolean;
  isSuperAdmin: () => boolean;
  loading: boolean;
  userRole: UserRole | null;
}

export const PermissionContext = createContext<PermissionContextType | undefined>(undefined);
