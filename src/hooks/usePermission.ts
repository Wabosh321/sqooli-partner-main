import { useAuth } from "./useAuth";

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

  const permissions: Array<{ category: string; level: string }> = [];
  const userRole = user?.role || null;

  const hasCategory = (category: string): boolean => {
    if (user?.role === "super_admin") return true;
    return permissions.some(
      (p) =>
        p.category === category && (p.level === "full" || p.level === "view"),
    );
  };

  const hasPermission = (permission: string): boolean => {
    const [category] = permission.split(".");
    return hasCategory(category);
  };

  const canRead = (category: string): boolean => {
    return hasCategory(category);
  };

  const canWrite = (category: string): boolean => {
    if (user?.role === "super_admin") return true;
    return permissions.some(
      (p) => p.category === category && p.level === "full",
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
