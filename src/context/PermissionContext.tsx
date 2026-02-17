import React, { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

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
  hasLevel: (level: "read" | "write" | "admin" | "full") => boolean;
  canRead: (category: string) => boolean;
  canWrite: (category: string) => boolean;
  isSuperAdmin: () => boolean;
  loading: boolean;
  userRole: UserRole | null;
}

export const PermissionContext = createContext<
  PermissionContextType | undefined
>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);

        if (!user?.id) {
          setPermissions(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, permissions")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setUserRole((profile?.role as UserRole) || null);

        if (profile?.permissions && Array.isArray(profile.permissions)) {
          setPermissions(profile.permissions as Permission[]);
        } else {
          setPermissions([]);
        }
      } catch (err) {
        setPermissions([]);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user?.id]);

  const value: PermissionContextType = {
    permissions,
    hasPermission: (permissionKey: string) => {
      return (
        permissions?.some(
          (p) => p.key === permissionKey || p.category === permissionKey,
        ) ?? false
      );
    },
    hasCategory: (category: string) => {
      return permissions?.some((p) => p.category === category) ?? false;
    },
    hasLevel: (level: "read" | "write" | "admin" | "full") => {
      return permissions?.some((p) => p.level === level) ?? false;
    },
    canRead: (category: string) => {
      return (
        permissions?.some(
          (p) =>
            p.category === category &&
            (p.level === "read" ||
              p.level === "write" ||
              p.level === "admin" ||
              p.level === "full"),
        ) ?? false
      );
    },
    canWrite: (category: string) => {
      return (
        permissions?.some(
          (p) =>
            p.category === category &&
            (p.level === "write" || p.level === "admin" || p.level === "full"),
        ) ?? false
      );
    },
    isSuperAdmin: () => {
      return (
        userRole === "super_admin" ||
        userRole === "admin_partner" ||
        userRole === "partner_admin"
      );
    },
    loading,
    userRole,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
