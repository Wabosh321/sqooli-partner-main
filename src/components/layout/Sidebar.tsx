"use client";

import { cn } from "../../lib/utils";
import { useMemo } from "react";
import { usePermissions } from "../../hooks/usePermission";
import { useDeviceSize } from "../../hooks/useDeviceSize";
import { useAuth } from "../../hooks/useAuth";
import { SIDEBAR_MENU } from "../ui/sidebar/sidebar.config";
import { SidebarItem } from "../ui/sidebar/SidebarItem";
import resolveSidebarSections from "../ui/sidebar/resolveSidebarSections";

interface AppSidebarProps {
  activeItem?: string;
  onSelect?: (id: string) => void;
  isDashboard?: boolean;
  isMobileDrawer?: boolean;
}

export function AppSidebar({
  activeItem = "dashboard",
  onSelect,
  isDashboard = false,
  isMobileDrawer = false,
}: AppSidebarProps) {
  const { permissions, loading, userRole } = usePermissions();
  const { isMobile } = useDeviceSize();
  const { partner } = useAuth();

  const handleSelect = (id: string, isLocked: boolean) => {
    if (isLocked) {
      alert("This feature is locked. Contact your administrator for access.");
      return;
    }
    onSelect?.(id);
  };

  const resolvedMenuItems = useMemo(() => {
    if (loading) return [];

    const resolver = resolveSidebarSections({
      partnerType: (partner as any)?.partner_type || null,
      accessLevel: (partner as any)?.access_level || null,
      userRole: userRole || null,
      permissions: permissions || null,
      partnerFlags: {
        onboarding_completed: (partner as any)?.onboarding_completed ?? true,
        wallet_setup_completed:
          (partner as any)?.wallet_setup_completed ?? false,
        campaign_created: (partner as any)?.campaign_created ?? false,
      },
    });

    return SIDEBAR_MENU.filter((item) => {
      if (
        item.excludeForRoles &&
        userRole &&
        item.excludeForRoles.includes(userRole)
      )
        return false;
      if (!resolver.isVisible(item.id)) return false;
      return true;
    }).map((item) => ({
      ...item,
      locked: resolver.isLocked(item.id),
    }));
  }, [loading, userRole, permissions, partner]);

  return (
    <aside
      className={cn(
        "transition-all duration-300 ease-in-out",
        "overflow-hidden flex flex-col",
        isMobileDrawer &&
          "h-full w-full rounded-none border-none shadow-none bg-background/95 backdrop-blur-md",
      )}
      style={
        isDashboard && !isMobileDrawer
          ? {
              position: "fixed",
              top: "82px",
              left: "12px",
              width: "100px",
              height: "716px",
              gap: "16px",
              paddingTop: "24px",
              paddingBottom: "24px",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-white)",
            }
          : undefined
      }
      role={isMobileDrawer ? "navigation" : undefined}
      aria-label={isMobileDrawer ? "Mobile navigation menu" : undefined}
    >
      <nav className="flex flex-col h-full overflow-y-auto" style={{ gap: 16 }}>
        <div
          className={cn("flex flex-col", isMobileDrawer ? "gap-1" : "gap-3")}
        >
          {resolvedMenuItems.map(({ id, label, icon: Icon, locked }) => {
            const isActive = id === activeItem;
            return (
              <SidebarItem
                key={id}
                id={id}
                label={label}
                icon={Icon}
                active={isActive}
                locked={locked}
                onClick={(itemId) => handleSelect(itemId, locked)}
                isMobile={isMobile}
                isMobileDrawer={isMobileDrawer}
              />
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
