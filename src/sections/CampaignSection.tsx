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

// PHASE 4: Supabase integration for campaigns
import { CampaignService } from "../infrastructure/campaign/campaign.service";

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

  const canViewCampaigns = canRead("campaigns");
  const canManageCampaigns = canWrite("campaigns");

  // PHASE 4: State for Supabase campaigns
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  // PHASE 4: Load campaigns from Supabase and subscribe to real-time changes
  useEffect(() => {
    if (!partner?._id && !partner?.id) {
      setCampaignsLoading(false);
      return;
    }

    const partnerId = partner._id || partner.id;

    // Initial load from Supabase
    const loadCampaigns = async () => {
      try {
        setCampaignsLoading(true);
        const fetchedCampaigns =
          await CampaignService.fetchByPartner(partnerId);

        // Map Supabase IDs to _id for compatibility
        const mapped = (fetchedCampaigns || []).map((c) => ({
          ...c,
          _id: c.id,
        }));

        // Apply role-based filtering
        const userRole = isConvexUser(user) ? user.role : "partner_member";
        let filtered = mapped;

        if (userRole === "admin_partner") {
          filtered = mapped.filter((c) => c.partner_id === partnerId);
        } else if (userRole === "partner_member") {
          filtered = mapped.filter(
            (c) =>
              c.partner_id === partnerId &&
              (c.created_by_user_id === user?.id || c.status === "pending"),
          );
        }

        setCampaigns(filtered);
      } catch (err) {
        console.error("Error loading campaigns:", err);
        toast.error("Failed to load campaigns");
      } finally {
        setCampaignsLoading(false);
      }
    };

    loadCampaigns();

    // PHASE 4: Subscribe to real-time campaign changes
    const unsubscribe = CampaignService.subscribeToCampaignChanges(
      partnerId,
      (updatedCampaign) => {
        // Update or add campaign in local state
        setCampaigns((prev) => {
          const existing = prev.findIndex((c) => c.id === updatedCampaign.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = { ...updatedCampaign, _id: updatedCampaign.id };
            return updated;
          }
          return [...prev, { ...updatedCampaign, _id: updatedCampaign.id }];
        });
      },
    );

    return () => {
      unsubscribe();
    };
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

  const handleDelete = async (campaign: any) => {
    if (!canManageCampaigns) {
      toast.error("You don't have permission to delete campaigns");
      return;
    }

    setLoading(true);
    try {
      // PHASE 4: Call RPC function to delete campaign
      const result = await CampaignService.deleteCampaign(
        campaign._id || campaign.id,
      );

      if (result.success) {
        toast.success("Campaign deleted successfully");
        // Remove from local state
        setCampaigns((prev) =>
          prev.filter((c) => c._id !== campaign._id && c.id !== campaign.id),
        );
        setShowConfirm(false);
      } else {
        toast.error(result.error || "Failed to delete campaign");
      }
    } catch (err) {
      console.error("Error deleting campaign:", err);
      toast.error("An error occurred while deleting the campaign");
    } finally {
      setLoading(false);
    }
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
