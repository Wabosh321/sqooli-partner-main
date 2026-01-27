import { useAuth } from "../hooks/useAuth";
import { usePartnerAccess } from "../hooks/usePartnerAccess";
import { AlertCircle } from "lucide-react";
import { NoCampaignCard } from "../components/common/NoCampaignCard";
import { supabase } from "../lib/supabase";
import { useState, useEffect } from "react";
import {
  DASHBOARD_SECTION_CONFIG,
  getResponsivePadding,
  getSectionContainerStyle,
} from "./SettingsSection";
import { useDeviceSize } from "../hooks/useDeviceSize";

export default function PaymentsSection() {
  const { partner } = useAuth();
  const { isMobile, isTablet } = useDeviceSize();
  const padding = getResponsivePadding(isMobile, isTablet);
  const [campaigns, setCampaigns] = useState<any[] | undefined>(undefined);

  const partnerId = partner?.id ?? partner?.convex_id; // Adjusted to use convex_id if id is unavailable

  const { partnerType } = usePartnerAccess();

  // Permission guard
  if (!partner && partnerType) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">
            Access Restricted
          </h3>
          <p className="text-gray-500 mt-2">
            Your partner tier doesn't include payment access.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!partnerId) {
      setCampaigns(undefined);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("partner_id", partnerId);

        if (error) {
          console.error("Error loading campaigns:", error);
          if (mounted) setCampaigns([]);
          return;
        }

        if (mounted) setCampaigns(data || []);
      } catch (err) {
        console.error(err);
        if (mounted) setCampaigns([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [partnerId]);

  return (
    <div style={getSectionContainerStyle(padding)}>
      <div
        className="mx-auto space-y-6"
        style={{
          width: "max(88.33vw, 1272px)",
          maxWidth: "100%",
        }}
      >
        {partner && (!campaigns || campaigns.length === 0) && (
          <NoCampaignCard />
        )}
      </div>
    </div>
  );
}
