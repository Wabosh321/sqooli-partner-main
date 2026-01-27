'use client';

import { 
  Lock,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMemo } from 'react';
import { usePermissions } from '../../hooks/usePermission';
import { useDeviceSize } from '../../hooks/useDeviceSize';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getDisplayName, isConvexUser } from '../../types/auth.types';
import { SIDEBAR_MENU } from '../ui/sidebar/sidebar.config';
import { SidebarItem } from '../ui/sidebar/SidebarItem';

interface AppSidebarProps {
  activeItem?: string;
  onSelect?: (id: string) => void;
  isDashboard?: boolean; // Show user profile section at bottom
  isMobileDrawer?: boolean; // True if rendering as mobile drawer instead of desktop sidebar
}

export function AppSidebar({
  activeItem = 'dashboard',
  onSelect,
  isDashboard = false,
  isMobileDrawer = false
}: AppSidebarProps) {
  const { hasPermission, hasCategory, permissions, loading, isSuperAdmin, userRole } = usePermissions();
  const { isMobile } = useDeviceSize();
  const { user, partner, loginMethod } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (id: string, isLocked: boolean) => {
    if (isLocked) {
      alert('This feature is locked. Contact your administrator for access.');
      return;
    }
    onSelect?.(id);
  };

  // Pure permission check: evaluate if a single item is accessible
  const checkAccess = (menuItem: typeof SIDEBAR_MENU[0]): boolean => {
    // If still loading permissions, deny access temporarily
    if (loading || !permissions) return false;

    // Super admin always has access (for items they can see)
    if (isSuperAdmin()) return true;

    if (menuItem.requiredPermission && hasPermission(menuItem.requiredPermission)) return true;
    if (menuItem.requiredCategory && hasCategory(menuItem.requiredCategory)) return true;

    return false;
  };

  // Check if specific onboarding steps are complete
  const isWalletSetupComplete = partner?.wallet_setup_completed === true;
  const isCampaignCreated = partner?.campaign_created === true;

  // Determine if a feature should be locked due to incomplete onboarding
  const isFeatureLockedByOnboarding = (itemId: string): boolean => {
    // Only apply onboarding locks if partner exists and onboarding is not complete
    if (!partner || partner.onboarding_completed) return false;

    // Lock these items until wallet + campaign are created
    const lockedUntilWalletAndCampaign = ['campaigns', 'programs', 'users'];
    
    if (lockedUntilWalletAndCampaign.includes(itemId)) {
      return !(isWalletSetupComplete && isCampaignCreated);
    }

    return false;
  };

  // Compute resolved menu with access state and visibility
  const resolvedMenuItems = useMemo(() => {
    if (loading) return [];
    
    return SIDEBAR_MENU.filter(item => {
      // Role-based visibility filter
      if (item.excludeForRoles && userRole && item.excludeForRoles.includes(userRole)) {
        return false;
      }
      return true;
    }).map(item => ({
      ...item,
      locked: !checkAccess(item) || isFeatureLockedByOnboarding(item.id),
    }));
  }, [loading, userRole, permissions, isSuperAdmin, partner?.wallet_setup_completed, partner?.campaign_created]);

  return (
    <>
      {/* Sidebar Container - Fixed height and width for desktop, full height for mobile drawer */}
      <aside
        className={cn(
          "transition-all duration-300 ease-in-out",
          "overflow-hidden flex flex-col",
          // preserve mobile drawer classes when rendering as drawer
          isMobileDrawer && (
            "h-full w-full rounded-none border-none shadow-none bg-background/95 backdrop-blur-md"
          )
        )}
        // Apply exact design for desktop (fixed) sidebar when used on dashboard
        // Responsive: scales to 1440x1024 proportions across all screen sizes
        style={isDashboard && !isMobileDrawer ? {
          position: 'fixed',
          top: 'max(8vh, 82px)',
          left: 'max(0.83vw, 12px)',
          width: 'max(6.94vw, 100px)',
          height: 'max(69.92vh, 716px)',
          gap: 'max(1.1vw, 16px)',
          paddingTop: 'max(2.34vh, 24px)',
          paddingBottom: 'max(2.34vh, 24px)',
          borderRadius: '12px',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: '#EAECF0',
          backgroundColor: '#FFFFFF',
          opacity: 1,
          transform: 'rotate(0deg)'
        } : undefined}
        role={isMobileDrawer ? "navigation" : undefined}
        aria-label={isMobileDrawer ? "Mobile navigation menu" : undefined}
      >
        {/* Navigation Container - Vertical layout with proper height management */}
        <nav className="flex flex-col h-full overflow-y-auto" style={{ gap: 16 }}>
          {/* Navigation Items Section - Vertical stack at top */}
          <div className={cn(
            "flex flex-col",
            isMobileDrawer ? "gap-1" : "gap-2 md:gap-3"
          )}>
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
    </>
  );
}
