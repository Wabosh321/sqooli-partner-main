import { useAuth } from "../../hooks/useAuth";
import { useDeviceSize } from "../../hooks/useDeviceSize";
import { HeaderContainer } from "./header/HeaderContainer";
import { HeaderLeft } from "./header/HeaderLeft";
import { HeaderRight } from "./header/HeaderRight";
import { useHeaderState } from "./header/useHeaderState";
import type { HeaderProps } from "./header/types";

export function Header({
  title = "Dashboard",
  isDashboard = false,
  mobileDrawerOpen = false,
  onMobileDrawerToggle,
}: HeaderProps) {
  const { user, loading, partner } = useAuth();
  const { isMobile } = useDeviceSize();

  const { fullName, email, initials, userRole, userExtension, onLogout } =
    useHeaderState({
      user,
      loading,
      partner,
    });

  // Loading state
  if (loading) {
    return (
      <HeaderContainer isMobile={isMobile}>
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
        </div>
      </HeaderContainer>
    );
  }

  // Not signed in state
  if (!user) {
    return (
      <HeaderContainer isMobile={isMobile}>
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">
          {title}
        </h1>
        <span className="text-xs sm:text-sm text-muted-foreground">
          Not signed in
        </span>
      </HeaderContainer>
    );
  }

  // Authenticated state
  const partnerType =
    (partner?.partner_type as "media" | "beneficiary" | null) || null;
  const partnerId = partner?.id ?? partner?._id ?? "";

  return (
    <HeaderContainer isMobile={isMobile}>
      <HeaderLeft
        title={title}
        isDashboard={isDashboard}
        isMobile={isMobile}
        mobileDrawerOpen={mobileDrawerOpen}
        onMobileDrawerToggle={onMobileDrawerToggle}
        partnerType={partnerType}
      />
      <HeaderRight
        partnerId={partnerId}
        fullName={fullName}
        email={email}
        initials={initials}
        userRole={userRole}
        userExtension={userExtension}
        onLogout={onLogout}
      />
    </HeaderContainer>
  );
}
