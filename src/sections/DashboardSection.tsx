"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { usePartnerAccess } from "../hooks/usePartnerAccess";
import { useDeviceSize } from "../hooks/useDeviceSize";
import { useUserCampaigns } from "../hooks/useUserCampaigns";
import { useUserRevenue } from "../hooks/useUserRevenue";
import { PermissionWrapper } from "../components/common/PermissionWrapper";
import { Loading } from "../components/common/Loading";
import { isConvexUser } from "../types/auth.types";
import type { DashboardCampaign } from "../types/global.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import Wallet from "../components/common/Wallet";
import MiniChart from "../components/common/MiniChart";
import { NoCampaignCard } from "../components/common/NoCampaignCard";
import CreateCampaignWizard from "../components/common/CreateCampaign";
import CreateProgramDialog from "../components/common/CreateProgramDialog";
import {
  Lock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Award,
  DollarSign,
  BookOpen,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";
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
import {
  DASHBOARD_SECTION_CONFIG,
  getResponsivePadding,
  getSectionContainerStyle,
} from "./SettingsSection";
import { Title } from "../components/ui/Typography";

export default function DashboardSection({
  activeItem,
  setActiveItem,
}: {
  activeItem: string;
  setActiveItem: (item: string) => void;
}) {
  const { isMobile, isTablet } = useDeviceSize();
  const padding = getResponsivePadding(isMobile, isTablet);
  const { user, partner } = useAuth();
  const { hasPermission, userRole, permissions } = usePermissions();
  const { canAccessDashboard, partnerType, accessLevel, getAvailableSections } =
    usePartnerAccess();
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showCreateProgramDialog, setShowCreateProgramDialog] = useState(false);

  const isSuperAdmin = isConvexUser(user) && userRole === "super_admin";

  // DEBUG: Log authorization decision
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

  // Permission guard
  if (!canAccessDashboard && !isSuperAdmin && partnerType) {
    console.warn("DashboardSection: Access Denied - canAccessDashboard=false", {
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

  // Permission checks
  const isDashboardAdmin = hasPermission("dashboard.admin");
  const canViewFullDashboard = hasPermission("dashboard.read");
  const canViewDashboard = isDashboardAdmin || canViewFullDashboard;
  const canCreateCampaigns = hasPermission("campaigns.write");

  // Use user campaigns and revenue hooks
  const { campaigns: userCampaigns, loading: campaignsLoading } =
    useUserCampaigns();
  const { revenue: userRevenue, loading: revenueLoading } = useUserRevenue();

  const partnerId = (partner as any)?.id ?? (partner as any)?._id;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(amount);
  };

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
    <div style={getSectionContainerStyle(padding)}>
      <div
        className="w-full"
        style={{
          maxWidth: "100%",
          width: "max(88.33vw, 1272px)",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "max(4.2vh, 43px)",
            gap: "max(0.69vw, 10px)",
          }}
        >
          <div>
            <Title>Dashboard</Title>
          </div>
          <div className="flex items-center gap-3">
            {canCreateCampaigns && (
              <Button
                onClick={() => setShowCreateWizard(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                + New Campaign
              </Button>
            )}
          </div>
        </div>

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

        {!partner ? (
          <Loading message="Loading your dashboard..." size="lg" />
        ) : campaignsLoading || revenueLoading ? (
          <Loading message="Loading your campaigns..." size="lg" />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              width: "100%",
            }}
          >
            {/* Wallet Card (full width, height 131px → 12.8vh) */}
            <div
              style={{
                width: "100%",
                height: "max(12.8vh, 131px)",
                overflow: "hidden",
              }}
            >
              <WalletBalanceCard wallet={null} />
            </div>

            {/* Row: SmallCardsGrid (75.04% width) + UpcomingCampaigns (23.58% width) with responsive gap */}
            <div
              style={{
                display: "flex",
                gap: "max(1.1vw, 16px)",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: "max(75.04%, 956px)",
                  aspectRatio: "956/194",
                  overflow: "hidden",
                }}
              >
                <SmallCardsGrid />
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: "max(23.58%, 300px)",
                  aspectRatio: "300/194",
                  overflow: "hidden",
                }}
              >
                <UpcomingCampaigns />
              </div>
            </div>

            {/* Row: LineChart (75.04% width) + RecentActivity (23.58% width) with responsive gap */}
            <div
              style={{
                display: "flex",
                gap: "max(1.1vw, 16px)",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: "max(75.04%, 956px)",
                  aspectRatio: "956/379",
                  overflow: "hidden",
                }}
              >
                <LineChart />
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: "max(23.58%, 300px)",
                  aspectRatio: "300/379",
                  overflow: "hidden",
                }}
              >
                <RecentActivity />
              </div>
            </div>
          </div>
        )}

        {/* Create Program Dialog (Super Admin only) */}
        <CreateProgramDialog
          open={showCreateProgramDialog}
          onOpenChange={setShowCreateProgramDialog}
        />
      </div>
    </div>
  );
}
