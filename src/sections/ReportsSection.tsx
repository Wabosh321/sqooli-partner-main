import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePartnerAccess } from "../hooks/usePartnerAccess";
import { AlertCircle } from "lucide-react";
import { NoCampaignCard } from "../components/common/NoCampaignCard";
import { ComingSoon } from "../components/common/ComingSoon";
import { Loading } from "../components/common/Loading";
import {
  DASHBOARD_SECTION_CONFIG,
  getResponsivePadding,
  getSectionContainerStyle,
} from "./SettingsSection";
import { useDeviceSize } from "../hooks/useDeviceSize";
import { supabase } from "../lib/supabase";

export default function ReportsSection() {
  const { partner } = useAuth();
  const { isMobile, isTablet } = useDeviceSize();
  const padding = getResponsivePadding(isMobile, isTablet);
  const { canAccessReports, partnerType } = usePartnerAccess();

  const [campaigns, setCampaigns] = useState<any[] | undefined>(undefined);

  // Permission guard
  if (!canAccessReports && partnerType) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">
            Access Restricted
          </h3>
          <p className="text-gray-500 mt-2">
            Your partner tier doesn't include reports access.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const loadCampaigns = async () => {
      if (!partner?._id && !partner?.id) {
        setCampaigns(undefined);
        return;
      }

      try {
        const partnerId = partner?._id || partner?.id;
        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("partner_id", partnerId);

        if (error) throw error;

        setCampaigns(data || []);
      } catch (err) {
        console.error("Error loading campaigns:", err);
        setCampaigns([]);
      }
    };

    loadCampaigns();
  }, [partner?._id, partner?.id]);

  if (partner && campaigns === undefined) {
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
        {partner && (!campaigns || campaigns.length === 0) ? (
          <NoCampaignCard />
        ) : (
          <ComingSoon
            title="Reports & Analytics"
            description="Comprehensive campaign reports and analytics are coming soon. Track your performance metrics, conversion rates, and revenue insights all in one place."
            icon="sparkles"
          />
        )}
      </div>
    </div>
  );
}
