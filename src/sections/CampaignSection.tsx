"use client";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Title } from "../components/ui/Typography";
import { Button } from "../components/ui/button";
import { Loading } from "../components/common/Loading";
import { usePartnerAccess } from "../hooks/usePartnerAccess";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { useUserCampaigns } from "../hooks/useUserCampaigns";
import { PermissionWrapper } from "../components/common/PermissionWrapper";
import { CampaignDetailDialog } from "../components/common/CampaignDetails";
import { ConfirmDialog } from "../components/common/ConfirmationDialog";
import { toast } from "sonner";
import CreateCampaignWizard from "../components/common/CreateCampaign";
import { isConvexUser } from "../types/auth.types";
import {
  DASHBOARD_SECTION_CONFIG,
  getResponsivePadding,
  getSectionContainerStyle,
} from "./SettingsSection";
import { useDeviceSize } from "../hooks/useDeviceSize";
import { CampaignHeader, CampaignTable } from "../ui/campaign";
import { Search, Menu, Plus, Lock, AlertCircle } from "lucide-react";
import campaignsData from "../auth/data/campaigns.json";

export default function CampaignSection() {
  const [activeTab, setActiveTab] = useState<"active" | "expired" | "draft">(
    "active",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<any | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  const { isMobile, isTablet } = useDeviceSize();
  const padding = getResponsivePadding(isMobile, isTablet);

  const { canAccessCampaigns, partnerType } = usePartnerAccess();
  const { user, partner } = useAuth();
  const { canRead, canWrite, loading: permissionsLoading } = usePermissions();
  const { campaigns: userCampaigns, loading: campaignsLoading } =
    useUserCampaigns();

  const canViewCampaigns = canRead("campaigns");
  const canManageCampaigns = canWrite("campaigns");

  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const allCampaigns = campaignsData.campaigns.map((c) => ({
      ...c,
      _id: c.id,
    }));

    // Filter campaigns based on user role and partner
    const userRole = isConvexUser(user) ? user.role : "partner_member";
    const partnerId = partner?._id || partner?.id;

    let filtered = allCampaigns;

    // If admin_partner, show all campaigns for their partner
    // If partner_member, show campaigns created by them or approve/decline campaigns created by others
    if (userRole === "admin_partner") {
      filtered = allCampaigns.filter((c) => c.partner_id === partnerId);
    } else if (userRole === "partner_member") {
      // Can see campaigns created by themselves and campaigns waiting for approval
      filtered = allCampaigns.filter(
        (c) =>
          c.partner_id === partnerId &&
          (c.created_by_user_id === user?.id || c.status === "pending"),
      );
    }

    setCampaigns(filtered);
  }, [user, partner]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
  };

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.filter((campaign: any) => {
      const matchesTab = campaign.status === activeTab;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        (campaign._id || "").toLowerCase().includes(q) ||
        (campaign.name || "").toLowerCase().includes(q) ||
        (campaign.promo_code || "").toLowerCase().includes(q) ||
        formatDate(campaign.duration_start).toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [campaigns, activeTab, searchQuery]);

  const handleDelete = (campaign: any) => {
    if (!canManageCampaigns) {
      toast.error("You don't have permission to delete campaigns");
      return;
    }

    toast.error("Campaign management is not available in demo mode");
  };

  // Permission guard
  if (!canAccessCampaigns && partnerType && partnerType !== "affiliate") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">
            Access Restricted
          </h3>
          <p className="text-gray-500 mt-2">
            Your partner tier doesn't include campaign access.
          </p>
        </div>
      </div>
    );
  }

  if (permissionsLoading || !partner) {
    return <Loading message="Loading your campaigns..." size="md" />;
  }

  return (
    <div style={getSectionContainerStyle(padding)}>
      <div
        className="mx-auto space-y-6"
        style={{
          width: "max(88.33vw, 1272px)",
          maxWidth: "100%",
        }}
      >
        <div className="flex items-center justify-between">
          <Title>Campaigns</Title>
          <div />
        </div>

        {canViewCampaigns && !canManageCampaigns && (
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                View-only mode:
              </span>{" "}
              You can view campaigns but cannot create or manage them.
            </p>
          </div>
        )}

        <CampaignHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreate={() => setShowCreateWizard(true)}
          onMenu={() => {}}
        />

        <Card className="border-border">
          <CardContent className="p-0">
            {/* Tabs */}
            <div className="border-b border-border px-6 pt-4">
              <div className="bg-transparent p-0 h-auto space-x-6">
                <button
                  className={`px-3 py-2 ${activeTab === "active" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  onClick={() => setActiveTab("active")}
                >
                  Active
                </button>
                <button
                  className={`px-3 py-2 ${activeTab === "draft" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  onClick={() => setActiveTab("draft")}
                >
                  Draft
                </button>
                <button
                  className={`px-3 py-2 ${activeTab === "expired" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  onClick={() => setActiveTab("expired")}
                >
                  Expired
                </button>
              </div>
            </div>

            <div className="mt-4">
              {!campaigns || campaignsLoading ? (
                <div className="p-6">
                  <Loading message="Loading campaigns..." size="sm" />
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery
                    ? "No campaigns match your search"
                    : `No ${activeTab} campaigns`}
                </div>
              ) : (
                <CampaignTable
                  campaigns={filteredCampaigns}
                  onView={(id) => {
                    const c = campaigns.find((x: any) => x._id === id);
                    setSelectedCampaign(c);
                    setIsDialogOpen(true);
                  }}
                  onDelete={(c) => {
                    setCampaignToDelete(c);
                    setShowConfirm(true);
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <CampaignDetailDialog
        campaign={selectedCampaign}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCopy={() => {}}
      />

      {partner?._id && canManageCampaigns && (
        <CreateCampaignWizard
          open={showCreateWizard}
          onClose={() => setShowCreateWizard(false)}
          partnerId={partner._id}
          user_id={user && isConvexUser(user) ? user._id : undefined}
        />
      )}

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Mark Campaign as Expired"
        description="Are you sure you want to mark this campaign as expired? This action cannot be undone."
        confirmLabel="Yes, Mark as Expired"
        onConfirm={() => campaignToDelete && handleDelete(campaignToDelete)}
        loading={loading}
      />
    </div>
  );
}
