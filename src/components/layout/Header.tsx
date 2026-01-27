import { ChevronDown, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import BadgeSvg from '../../assets/Badge.svg';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuth } from '../../hooks/useAuth';
// Theme button replaced by notification icon per request
import { NotificationDropdown } from '../common/NotificationDropDown';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { handleLogout } from '../../utils/handleLogout';
import { getDisplayName, getUserEmail, getUserInitials } from '../../types/auth.types';
import { supabase } from '../../lib/supabase';
import { useDeviceSize } from '../../hooks/useDeviceSize';

interface HeaderProps {
  title?: string;
  isDashboard?: boolean; // Hide avatar dropdown on desktop dashboard pages
  mobileDrawerOpen?: boolean; // Mobile drawer state (for dashboard mobile only)
  onMobileDrawerToggle?: (open: boolean) => void; // Callback to toggle drawer (for dashboard mobile)
}

export function Header({ 
  title = 'Dashboard', 
  isDashboard = false,
  mobileDrawerOpen = false,
  onMobileDrawerToggle
}: HeaderProps) {
  const { user, loading, partner, loginMethod } = useAuth();
  // theme toggler removed; showing notification icon instead
  const navigate = useNavigate();
  const { isMobile, isTablet } = useDeviceSize();

  const onLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      toast.success("Logged out successfully 👋");
      navigate("/signIn");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An unexpected error occurred during logout.");
    }
  };

  if (loading) {
    return (
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '70px', zIndex: 1001, borderBottomWidth: '1px' }} className="bg-background border-b border-border shrink-0 shadow-sm">
        <div className="flex items-center justify-between" style={{ height: '70px', paddingLeft: isMobile ? 'max(0.83vw, 12px)' : 'max(2.22vw, 32px)', paddingRight: isMobile ? 'max(0.83vw, 12px)' : 'max(2.22vw, 32px)' }}>
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
      </header>
    );
  }

  if (!user) {
    return (
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '70px', zIndex: 1001, borderBottomWidth: '1px' }} className="bg-background border-b border-border shrink-0 shadow-sm">
        <div className="flex items-center justify-between" style={{ height: '70px', paddingLeft: isMobile ? 'max(0.83vw, 12px)' : 'max(2.22vw, 32px)', paddingRight: isMobile ? 'max(0.83vw, 12px)' : 'max(2.22vw, 32px)' }}>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h1>
          <span className="text-xs sm:text-sm text-muted-foreground">Not signed in</span>
        </div>
      </header>
    );
  }

  const fullName = getDisplayName(user);
  const email = getUserEmail(user);
  const initials = getUserInitials(user);

  const avatarUrl = '';
  const userRole = partner?.role || null;
  const userExtension = partner?.extension || null;

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1001, borderBottomWidth: '1px' }} className="bg-background border-b border-border shrink-0 shadow-sm">
      <div className={`flex items-center justify-between gap-2`} style={{ height: '70px', paddingLeft: isMobile ? 'max(0.83vw, 12px)' : 'max(2.22vw, 32px)', paddingRight: isMobile ? 'max(0.83vw, 12px)' : 'max(2.22vw, 32px)' }}>
        {/* Left: Menu button (mobile dashboard only) + Logo + Badge/Title */}
        <div className="flex items-center" style={{ gap: '32px', width: '705.828125px', height: '30px' }}>
          {/* Mobile Menu Button - Only show on mobile dashboard */}
          {isDashboard && isMobile && onMobileDrawerToggle && (
            <button
              onClick={() => onMobileDrawerToggle(!mobileDrawerOpen)}
              className="p-1.5 rounded-lg hover:bg-muted/40 transition-colors"
              aria-label="Toggle navigation drawer"
              aria-expanded={mobileDrawerOpen}
              aria-controls="mobile-drawer"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          )}

          <img
            src="/sqooli-footer-logo.svg"
            alt="Sqooli"
            style={{ width: '152.66px', height: '30px' }}
            className="cursor-pointer w-auto"
            onClick={() => navigate('/')}
          />
          {partner?.partner_type === 'media' ? (
            <img
              src={BadgeSvg}
              alt="Media Badge"
              style={{ width: '143px', height: '22px' }}
              className="cursor-pointer"
            />
          ) : (
            <h1 className={`font-semibold text-foreground ${isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg sm:text-xl'}`}>
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* Notification Dropdown - always visible */}
          <NotificationDropdown partnerId={partner?.id ?? partner?._id ?? ''} />

          {/* Notification icon is provided by NotificationDropdown trigger */}

          {/* Avatar Dropdown - Always show in header */}
          {
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`gap-2 ${isMobile ? 'px-1' : 'px-2'} hover:bg-transparent`}>
                  <Avatar className={`${isMobile ? 'h-7 w-7' : isTablet ? 'h-8 w-8' : 'h-8 w-8'}`}>
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary border border-border text-xs text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!isMobile && (
                    <div className="hidden lg:flex flex-col items-start max-w-[150px]">
                      <span className="text-sm font-medium text-foreground truncate w-full">
                        {fullName}
                      </span>
                      {email && (
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {email}
                        </span>
                      )}
                      {userRole && (
                        <span className="text-xs text-muted-foreground truncate w-full capitalize">
                          {userRole.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  )}
                  <ChevronDown className={`text-foreground ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className={`${isMobile ? 'w-48' : 'w-56'}`}>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                
                {partner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Organization: {partner.name}
                    </DropdownMenuLabel>
                  </>
                )}
                
                {userExtension && (
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Extension: {userExtension}
                  </DropdownMenuLabel>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={onLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        </div>
      </div>
    </header>
  );
}
