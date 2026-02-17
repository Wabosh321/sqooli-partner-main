import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { HeaderLeftProps } from "./types";
import { PartnerBadge } from "./PartnerBadge";

export function HeaderLeft({
  title,
  isDashboard,
  isMobile,
  mobileDrawerOpen,
  onMobileDrawerToggle,
  partnerType,
}: HeaderLeftProps) {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center"
      style={{ gap: "32px", height: "30px" }}
    >
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

      {/* Logo - exact size from Figma */}
      <img
        src="/icons/sqooli-logo.svg"
        alt="Sqooli"
        style={{ width: "153px", height: "30px" }}
        className="cursor-pointer"
        onClick={() => navigate("/")}
      />

      {/* Partner Badge or Title */}
      <PartnerBadge partnerType={partnerType} />
      {!partnerType && (
        <h1 
          className="font-semibold text-lg sm:text-xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h1>
      )}
    </div>
  );
}
