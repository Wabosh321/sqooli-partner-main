"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardSection from "../sections/DashboardSection";
import CampaignSection from "../sections/CampaignSection";
import WalletSection from "../sections/WalletSection";
import ReportsSection from "../sections/ReportsSection";
import UserSection from "../sections/UserSection";
import ProgramsSection from "../sections/ProgramSection";
import SettingsSection from "../sections/SettingsSection";
import TasksSection from "../sections/TasksSection";
import BeneficiarySection from "../sections/BeneficiarySection";
import SponsorshipSection from "../sections/sponsorship";
import OnboardingPage from "./Onboarding";
import { usePermissions } from "../hooks/usePermission";
import { usePartnerAccess } from "../hooks/usePartnerAccess";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "react-router-dom";
import LockedSection from "../sections/LockedSection";
import PermissionRefreshBanner from "../components/common/PermissionRefresherBanner";
import { useDeviceSize } from "../hooks/useDeviceSize";

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const activeItemFromUrl = searchParams.get("tab") || "dashboard";
  const [activeItem, setActiveItem] = useState(activeItemFromUrl);
  const { hasCategory, permissions } = usePermissions();
  const {
    canAccessSection,
    isSectionAllowed,
    getAvailableSections,
    partnerType,
    accessLevel,
  } = usePartnerAccess();
  const { isMobile, isTablet } = useDeviceSize();
  const { user, partner, loading: authLoading, refetch } = useAuth();
  const location = useLocation();

  const prevPermissions = useRef<string | null>(null);
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);

  // Update activeItem when URL changes
  useEffect(() => {
    setActiveItem(activeItemFromUrl);
  }, [activeItemFromUrl]);

  useEffect(() => {
    if (!permissions) return;

    const currentPermStr = JSON.stringify(permissions);
    if (prevPermissions.current && prevPermissions.current !== currentPermStr) {
      setShowRefreshBanner(true);
    }
    prevPermissions.current = currentPermStr;
  }, [permissions]);

  /**
   * Check access based on:
   * 1. Partner type's available sections (highest priority)
   * 2. User's specific permissions
   * 3. User's role within partner type
   */
  const canAccess = (category: string): boolean => {
    // Use canonical partner resolver via usePartnerAccess when partner is present
    if (partner && (partner as any).partner_type) {
      return isSectionAllowed(category);
    }

    // Fallback to permission system (PermissionProvider derives permissions from resolver)
    if (!permissions || permissions.length === 0) return false;

    const admin = permissions.some(
      (p) => p.category === "all_access" || p.level === "full",
    );
    if (admin) return true;

    return hasCategory(category);
  };

  const sectionMap: Record<string, React.ReactNode> = {
    onboarding: <OnboardingPage />,

    dashboard: canAccess("dashboard") ? (
      <DashboardSection activeItem={activeItem} setActiveItem={setActiveItem} />
    ) : (
      <LockedSection sectionName="Dashboard" />
    ),

    campaigns: canAccess("campaigns") ? (
      <CampaignSection />
    ) : (
      <LockedSection sectionName="Campaigns" />
    ),

    wallet: canAccess("wallet") ? (
      <WalletSection activeItem={activeItem} setActiveItem={setActiveItem} />
    ) : (
      <LockedSection sectionName="Wallet" />
    ),

    reports: canAccess("reports") ? (
      <ReportsSection />
    ) : (
      <LockedSection sectionName="Reports" />
    ),

    users: canAccess("users") ? (
      <UserSection />
    ) : (
      <LockedSection sectionName="Users" />
    ),

    programs: canAccess("programs") ? (
      <ProgramsSection />
    ) : (
      <LockedSection sectionName="Programs" />
    ),

    tasks: canAccess("tasks") ? (
      <TasksSection />
    ) : (
      <LockedSection sectionName="Tasks" />
    ),

    beneficiaries: canAccess("beneficiaries") ? (
      <BeneficiarySection />
    ) : (
      <LockedSection sectionName="Beneficiaries" />
    ),

    sponsorships: canAccess("sponsorships") ? (
      <SponsorshipSection />
    ) : (
      <LockedSection sectionName="Sponsorships" />
    ),

    settings: canAccess("settings") ? (
      <SettingsSection />
    ) : (
      <LockedSection sectionName="Settings" />
    ),
  };

  // Determine which section to display
  // If route is /tasks, show tasks. If partner onboarding is incomplete and user is not super_admin, show onboarding stage
  const isTasksPath = location.pathname === "/tasks";
  const displayedItem = isTasksPath
    ? "tasks"
    : partner && !partner.onboarding_completed && user?.role !== "super_admin"
      ? "onboarding"
      : activeItem;

  // Debug log when displayedItem changes
  useEffect(() => {
    console.log("🎯 Dashboard displayedItem changed:", {
      displayedItem,
      onboarding_completed: partner?.onboarding_completed,
      userRole: user?.role,
      partner_id: partner?.id,
    });
  }, [displayedItem, partner?.onboarding_completed]);

  return (
    <>
      {showRefreshBanner && (
        <PermissionRefreshBanner onRefresh={() => window.location.reload()} />
      )}

      <main
        className={`w-full h-full overflow-y-auto bg-[#F7F9FC] ${isMobile ? "p-3" : isTablet ? "p-4" : "p-6"}`}
      >
        {sectionMap[displayedItem]}
      </main>
    </>
  );
}
