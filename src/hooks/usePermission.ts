import { useAuth } from "./useAuth";
import { getJsonAuthUser } from "../auth/handleJsonAuth";

export interface PermissionContext {
  permissions: Array<{
    category: string;
    level: string;
  }>;
  hasCategory: (category: string) => boolean;
  hasPermission: (permission: string) => boolean;
  canRead: (category: string) => boolean;
  canWrite: (category: string) => boolean;
  isSuperAdmin: () => boolean;
  loading: boolean;
  userRole: string | null;
}

export function usePermissions(): PermissionContext {
  const { user, loading } = useAuth();

  // Get permissions from JSON user
  const getPermissionsFromJson = () => {
    const jsonUser = getJsonAuthUser();
    if (!jsonUser) return [];
    return jsonUser.permissions || [];
  };

  const permissions = getPermissionsFromJson();
  const jsonUser = getJsonAuthUser();
  const userRole = jsonUser?.role || null;

  const hasCategory = (category: string): boolean => {
    if (!permissions || permissions.length === 0) return false;

    // Check for full access
    const hasFullAccess = permissions.some(
      (p) => p.category === "all_access" || p.level === "full"
    );
    if (hasFullAccess) return true;

    // Check specific category
    return permissions.some(
      (p) =>
        p.category === category && (p.level === "full" || p.level === "view")
    );
  };

  const hasPermission = (permission: string): boolean => {
    // Support both "category" and "category.action" formats
    const [category] = permission.split(".");
    return hasCategory(category);
  };

  const canRead = (category: string): boolean => {
    return hasCategory(category);
  };

  const canWrite = (category: string): boolean => {
    if (!permissions || permissions.length === 0) return false;

    // Check for full access
    const hasFullAccess = permissions.some(
      (p) => p.category === "all_access" || p.level === "full"
    );
    if (hasFullAccess) return true;

    // Check specific category for write permission (full level only)
    return permissions.some(
      (p) => p.category === category && p.level === "full"
    );
  };

  const isSuperAdmin = (): boolean => {
    return userRole === "super_admin" || userRole === "admin_partner";
  };

  return {
    permissions,
    hasCategory,
    hasPermission,
    canRead,
    canWrite,
    isSuperAdmin,
    loading,
    userRole,
  };
}
