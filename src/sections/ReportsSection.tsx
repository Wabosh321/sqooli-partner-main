import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePartnerAccess } from "../hooks/usePartnerAccess";
import { AlertCircle } from "lucide-react";
import supabaseCRUD from "../lib/supabaseCRUD";
import { NoCampaignCard } from "../components/common/NoCampaignCard";
import { ComingSoon } from "../components/common/ComingSoon";
import { Loading } from "../components/common/Loading";
import { DASHBOARD_SECTION_CONFIG, getResponsivePadding, getSectionContainerStyle } from "./SettingsSection";
import { useDeviceSize } from "../hooks/useDeviceSize";

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
          <h3 className="text-lg font-semibold text-gray-900">Access Restricted</h3>
          <p className="text-gray-500 mt-2">Your partner tier doesn't include reports access.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!partner?._id) {
      setCampaigns(undefined);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await supabaseCRUD.getCampaignsByPartner(partner._id as any);
        if (mounted) setCampaigns(res.data || []);
      } catch (err) {
        console.error('Error loading campaigns:', err);
        if (mounted) setCampaigns([]);
      }
    })();

    return () => { mounted = false; };
  }, [partner?._id]);

  if (partner && campaigns === undefined) {
    return (
      <Loading 
        message="Loading your campaigns..." 
        size="md"
      />
    );
  }

  return (
    <div style={getSectionContainerStyle(padding)}>
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
  );
}
