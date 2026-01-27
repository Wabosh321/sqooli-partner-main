// PermissionProvider.tsx
import type { ReactNode } from "react";
import { PermissionContext, type Permission, type UserRole } from "./PermissionContext";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect, useMemo } from "react";
import { isConvexUser, type Partner } from "../types/auth.types";
import { supabase } from "../lib/supabase";

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, partner, loading: authLoading, loginMethod } = useAuth();
  const [userPermissionIds, setUserPermissionIds] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Load role from user or partner; permissions table is deferred to post-MVP
  useEffect(() => {
    if (isConvexUser(user)) {
      setUserRole(user.role as UserRole);
      setUserPermissionIds((user as any).permission_ids ?? []);
    } else if (partner) {
      setUserRole((partner as Partner).role as UserRole);
      setUserPermissionIds((partner as any).permission_ids ?? []);
    } else {
      setUserRole(null);
      setUserPermissionIds([]);
    }
  }, [user, partner]);

  // Permissions derived from role AND partner type
  // Priority: partner.partner_type -> user.role -> defaults
  const permissions: Permission[] = useMemo(() => {
    const perms: Permission[] = [];
    
    // Admin users get full access (super_admin, partner_admin, admin_partner)
    if (userRole === "super_admin" || userRole === "partner_admin" || userRole === "admin_partner") {
      return [
        {
          _id: "all_access",
          key: "all_access",
          name: "Full Access",
          description: "Full system access",
          category: "all_access",
          level: "full",
          is_default: true,
          created_at: new Date().toISOString(),
        }
      ];
    }
    
    // Partners get section-based permissions from their partner_type
    const partnerType = (partner as any)?.partner_type;
    const accessLevel = (partner as any)?.access_level;
    const status = (partner as any)?.status;
    
    // DEBUG: Log permission resolution
    if (import.meta.env.DEV) {
      console.debug('PermissionProvider: permission resolution', {
        userRole,
        partnerType,
        accessLevel,
        status,
      });
    }
    
    // If partner has a valid partner_type, grant partner permissions
    // (status may be null or inactive, but partner_type indicates the user is a partner)
    if (partnerType) {
      // Map partner sections to permission objects
      const sectionMap: Record<string, string[]> = {
        affiliate: ['campaigns', 'wallet'],
        media: ['campaigns', 'wallet', 'reports'],
        corporate: ['campaigns', 'wallet', 'reports'],
        institutional: ['campaigns', 'wallet', 'reports', 'users', 'programs', 'settings'],
      };
      
      const sections = sectionMap[partnerType] || sectionMap.affiliate;
      
      // Add dashboard permission for all partners
      perms.push({
        _id: "dashboard.read",
        key: "dashboard.read",
        name: "View Dashboard",
        description: "Can view dashboard",
        category: "dashboard",
        level: "read",
        is_default: true,
        created_at: new Date().toISOString(),
      });
      
      // Add section-specific permissions
      for (const section of sections) {
        perms.push({
          _id: `${section}.read`,
          key: `${section}.read`,
          name: `View ${section}`,
          description: `Can view ${section}`,
          category: section,
          level: "read",
          is_default: true,
          created_at: new Date().toISOString(),
        });
      }
    }
    
    return perms;
  }, [userRole, partner]);

  const loading = authLoading;

  // Check if user is super admin (has full access)
  const isSuperAdmin = (): boolean => {
    return userRole === "super_admin";
  };

  // Check if user has exact permission by key
  const hasPermission = (permissionKey: string): boolean => {
    if (isSuperAdmin()) return true;
    
    // Check permissions array first
    if (permissions && permissions.length > 0) {
      // Check for exact key match
      if (permissions.some((p) => p.key === permissionKey)) {
        return true;
      }
      // Check for category match (e.g., "dashboard" matches "dashboard.read")
      const category = permissionKey.split('.')[0];
      if (permissions.some((p) => p.category === category)) {
        return true;
      }
      // Check for full access
      if (permissions.some((p) => p.category === "all_access" || p.level === "full")) {
        return true;
      }
    }
    
    return false;
  };

  // Check if user has exact level in a category
  const hasLevel = (level: "read" | "write" | "admin" | "full"): boolean => {
    if (isSuperAdmin()) return true;
    if (!userRole) return false;
    if (userRole === "partner_admin" || userRole === "admin_partner") return true;
    
    // Check permissions array
    if (permissions && permissions.length > 0) {
      if (permissions.some((p) => p.level === level || p.level === "full")) {
        return true;
      }
    }
    
    return false;
  };

  // Check if user has permission in a category
  const hasCategory = (category: string): boolean => {
    if (isSuperAdmin()) return true;
    if (!userRole) return false;
    if (userRole === "partner_admin" || userRole === "admin_partner") return true;
    
    // Check permissions array - most important for partners
    if (permissions && permissions.length > 0) {
      if (permissions.some((p) => p.category === category)) {
        return true;
      }
      // Check for full access
      if (permissions.some((p) => p.category === "all_access" || p.level === "full")) {
        return true;
      }
    }
    
    return false;
  };

  // Strict read/write checks
  const canRead = (category: string): boolean => {
    if (isSuperAdmin()) return true;
    // Allow if explicit permission found
    if (permissions.some((p) => p.category === category && (p.level === "read" || p.level === "write" || p.level === "admin" || p.level === "full"))) {
      return true;
    }
    // Allow if has full access
    if (permissions.some((p) => p.category === "all_access" || p.level === "full")) {
      return true;
    }
    return false;
  };

  const canWrite = (category: string): boolean => {
    if (isSuperAdmin()) return true;
    // Allow if explicit write/admin/full permission found
    if (permissions.some((p) => p.category === category && (p.level === "write" || p.level === "admin" || p.level === "full"))) {
      return true;
    }
    // Allow if has full access
    if (permissions.some((p) => p.category === "all_access" || p.level === "full")) {
      return true;
    }
    return false;
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions: permissions.length > 0 ? permissions : null,
        hasPermission,
        hasCategory,
        hasLevel,
        canRead,
        canWrite,
        isSuperAdmin,
        loading,
        userRole,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}
