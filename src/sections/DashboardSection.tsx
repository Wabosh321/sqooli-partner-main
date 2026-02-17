"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { usePartnerAccess } from "../hooks/usePartnerAccess";
import { usePartnerPermissions } from "../hooks/usePartnerPermissions";
import { useDeviceSize } from "../hooks/useDeviceSize";
import { supabase } from "../lib/supabase";
import { Loading } from "../components/common/Loading";
import { isConvexUser } from "../types/auth.types";
import type { DashboardCampaign } from "../types/global.types";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import CreateCampaignWizard from "../components/common/CreateCampaign";
import CreateProgramDialog from "../components/common/CreateProgramDialog";
import { Lock, AlertCircle } from "lucide-react";
import SuperAdminDashboard from "../components/common/SuperAdminDashboard";
import {
  createAuthDebugRecord,
  logAuthorizationCheck,
} from "../lib/authDebugger";
import LineChart from "../ui/dashboard/LineChart";
import WalletBalanceCard from "../ui/dashboard/WalletBalanceCard";
import SmallCardsGrid from "../ui/dashboard/SmallCardsGrid";
import UpcomingCampaigns from "../ui/dashboard/UpcomingCampaigns";
import RecentActivity from "../ui/dashboard/RecentActivity";

export default function DashboardSection({
  activeItem,
  setActiveItem,
}: {
  activeItem: string;
  setActiveItem: (item: string) => void;
}) {
  const { isMobile, isTablet } = useDeviceSize();
  const { user, partner } = useAuth();
  const { hasPermission, userRole, permissions } = usePermissions();
  const { canAccessDashboard, partnerType, accessLevel, getAvailableSections } =
    usePartnerAccess();
  const { isBeneficiaryPartner, isMediaPartner } = usePartnerPermissions();

  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showCreateProgramDialog, setShowCreateProgramDialog] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<DashboardCampaign[] | undefined>(
    undefined,
  );

  const isSuperAdmin = isConvexUser(user) && userRole === "super_admin";
  const isDashboardBeneficiaryMode = isBeneficiaryPartner();
  const isDashboardMediaMode = isMediaPartner();
  const canViewDashboard =
    hasPermission("dashboard.read") || hasPermission("dashboard.admin");
  const canCreateCampaigns = hasPermission("campaigns.write");

  const partnerId = (partner as any)?.id ?? (partner as any)?._id;

  // Debug authorization
  useEffect(() => {
    const debugRecord = createAuthDebugRecord(
      user,
      partner,
      permissions || [],
      canAccessDashboard,
      getAvailableSections(),
      !canAccessDashboard && !isSuperAdmin && partnerType
        ? "Partner access denied"
        : null,
    );
    logAuthorizationCheck("DashboardSection", debugRecord);
  }, [
    user,
    partner,
    permissions,
    canAccessDashboard,
    isSuperAdmin,
    partnerType,
    getAvailableSections,
  ]);

  // Fetch data (PHASE 4 REFACTOR: Use RPCs instead of direct queries)
  useEffect(() => {
    if (!partnerId || !canViewDashboard) {
      setCampaigns(undefined);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        // PHASE 4: Use get_partner_campaigns RPC
        const { data: campaignsData, error: campaignsError } =
          await supabase.rpc("get_partner_campaigns", {
            p_partner_id: partnerId,
          });

        if (campaignsError) {
          console.error("Error loading campaigns:", campaignsError);
          if (mounted) setCampaigns([]);
          return;
        }

        if (mounted) setCampaigns((campaignsData as DashboardCampaign[]) || []);

        // PHASE 4: Use get_partner_wallet RPC
        const { data: walletData, error: walletError } = await supabase.rpc(
          "get_partner_wallet",
          { p_partner_id: partnerId },
        );

        if (walletError) {
          console.error("Error loading wallet:", walletError);
        } else if (
          mounted &&
          walletData &&
          Array.isArray(walletData) &&
          walletData.length > 0
        ) {
          setWallet(walletData[0]);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setCampaigns([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [partnerId, canViewDashboard]);

  // Permission guard for non-super admin
  if (!canAccessDashboard && !isSuperAdmin && partnerType) {
    console.warn("DashboardSection: Access Denied", {
      userRole,
      partnerType,
      accessLevel,
    });
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">
            Access Restricted
          </h3>
          <p className="text-gray-500 mt-2">
            Your partner tier doesn't include dashboard access.
          </p>
        </div>
      </div>
    );
  }

  if (isSuperAdmin) {
    return <SuperAdminDashboard setActiveItem={setActiveItem} />;
  }

  if (!canViewDashboard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Dashboard Access Restricted
                </h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>You don't have permission to view the dashboard.</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to request{" "}
                <span className="font-medium text-foreground">
                  dashboard.view
                </span>{" "}
                permission.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "var(--color-dashboard-bg)",
        padding: isMobile ? "16px" : "12px 32px",
      }}
    >
      <div
        style={{
          maxWidth: "1272px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* HEADER - Dashboard title + Date picker */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "43px",
            gap: "10px",
          }}
        >
          <h1
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "24px",
              fontWeight: 600,
              lineHeight: "28px",
              color: "var(--color-text-primary)",
            }}
          >
            Dashboard
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "43px",
              padding: "8px 12px",
              borderRadius: "8px",
              backgroundColor: "var(--color-white)",
              boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
              border: "1px solid var(--color-border)",
            }}
          >
            <img
              src="/icons/calendar-icon.svg"
              alt=""
              style={{ width: "13px", height: "15px" }}
            />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <span
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "var(--color-text-gray)",
                }}
              >
                12 Jan 2024 - 13 Feb 2024
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <span
                  style={{
                    fontFamily: "Outfit, sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--color-text-gray)",
                  }}
                >
                  Last 28 Days
                </span>
                <img
                  src="/icons/dropdown-arrow.svg"
                  alt=""
                  style={{ width: "10px", height: "6px" }}
                />
              </div>
            </div>
          </div>
        </div>

        {!partner ? (
          <Loading message="Loading your dashboard..." size="lg" />
        ) : campaigns === undefined ? (
          <Loading message="Loading your campaigns..." size="lg" />
        ) : (
          <>
            {/* Wallet Balance Card - Full Width */}
            <div style={{ width: "100%", height: "131px" }}>
              <WalletBalanceCard wallet={wallet} />
            </div>

            {/* MEDIA MODE: Standard Layout */}
            {isDashboardMediaMode && (
              <>
                {/* Row: SmallCardsGrid + UpcomingCampaigns */}
                <div style={{ display: "flex", gap: "16px", width: "100%" }}>
                  <div style={{ width: "956px", height: "194px" }}>
                    <SmallCardsGrid />
                  </div>
                  <div style={{ flex: 1, minWidth: "300px", height: "194px" }}>
                    <UpcomingCampaigns />
                  </div>
                </div>

                {/* Row: LineChart + RecentActivity */}
                <div style={{ display: "flex", gap: "16px", width: "100%" }}>
                  <div style={{ width: "956px", height: "379px" }}>
                    <LineChart />
                  </div>
                  <div style={{ flex: 1, minWidth: "300px", height: "379px" }}>
                    <RecentActivity />
                  </div>
                </div>
              </>
            )}

            {/* BENEFICIARY MODE: 3:1 Grid Layout */}
            {isDashboardBeneficiaryMode && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "956px 1fr",
                  gap: "16px",
                  width: "100%",
                }}
              >
                {/* Left Column */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div style={{ width: "100%", height: "194px" }}>
                    <SmallCardsGrid />
                  </div>
                  <div style={{ width: "100%", height: "379px" }}>
                    <LineChart />
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ minWidth: "300px", minHeight: "583px" }}>
                  <RecentActivity />
                </div>
              </div>
            )}
          </>
        )}

        {/* Dialogs */}
        {showCreateWizard &&
          partner?._id &&
          canCreateCampaigns &&
          user &&
          isConvexUser(user) && (
            <CreateCampaignWizard
              partnerId={partner._id}
              user_id={user._id}
              open={showCreateWizard}
              onClose={() => setShowCreateWizard(false)}
            />
          )}

        <CreateProgramDialog
          open={showCreateProgramDialog}
          onOpenChange={setShowCreateProgramDialog}
        />
      </div>
    </div>
  );
}
