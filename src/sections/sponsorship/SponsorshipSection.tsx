import { Card } from "../../components/ui/card";
import { Loading } from "../../components/common/Loading";
import LockedSection from "../LockedSection";
import { useAuth } from "../../hooks/useAuth";
import { usePartnerAccess } from "../../hooks/usePartnerAccess";
import { usePermissions } from "../../hooks/usePermission";
import type { ReactNode } from "react";
import { SponsorshipHeader } from "./components/SponsorshipHeader";
import { SponsorshipStats } from "./components/SponsorshipStats";
import { SponsorshipSearch } from "./components/SponsorshipSearch";
import { SponsorshipTable } from "./components/SponsorshipTable";
import { BuyLessonBundlesModal } from "./components/BuyLessonBundlesModal";
import { useSponsorshipState } from "./hooks/useSponsorshipState";
import { useSponsorshipList } from "./hooks/useSponsorshipList";
import { useSponsorshipStudents } from "./hooks/useSponsorshipStudents";
import type { SponsorshipMetrics } from "./types/sponsorship.types";

/**
 * SponsorshipSection handles the lesson bundle sponsorship workflow.
 *
 * Primary responsibilities:
 * - Render sponsorship list and metrics dashboard
 * - Orchestrate the "Buy Lesson Bundles" multi-step modal flow
 * - Manage student award distribution and selection
 *
 * State Dependencies:
 * - useSponsorshipState: Modal step, tier, amount, selected students
 * - useSponsorshipList: Fetch all sponsorship records with pagination
 * - useSponsorshipStudents: Fetch students for a given sponsorship
 *
 * Access Control:
 * - Requires partner_type === "sponsorships"
 * - Permission checks via usePermissions
 */
export function SponsorshipSection(): ReactNode {
  const { user } = useAuth();
  const { canAccessSponsorships } = usePartnerAccess();
  const { hasPermission } = usePermissions();

  // Early return for unauthorized access
  if (!canAccessSponsorships) {
    return <LockedSection sectionName="Sponsorships" />;
  }

  const {
    isBuyModalOpen,
    modalStep,
    selectedTier,
    selectedAmount,
    customAmount,
    selectedStudents,
    searchQuery,
    setSelectedTier,
    setSelectedAmount,
    setCustomAmount,
    setSearchQuery,
    openBuyModal,
    closeBuyModal,
    proceedToNextStep,
    proceedToAwardStep,
    toggleStudentSelection,
  } = useSponsorshipState();

  const { sponsorships, loading: sponsorshipsLoading } = useSponsorshipList();
  const { students, loading: studentsLoading } = useSponsorshipStudents();

  // Mock metrics (would be calculated from data in production)
  const metrics: SponsorshipMetrics = {
    totalSlots: 12,
    claimedSlots: 8,
    pendingClaim: 2,
    availableSlots: 2,
  };

  if (sponsorshipsLoading) {
    return <Loading message="Loading sponsorships..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <SponsorshipHeader onAwardClick={() => {}} />

      {/* Metrics Stats */}
      <SponsorshipStats metrics={metrics} onAwardClick={() => {}} />

      {/* Main Content Card */}
      <Card className="overflow-hidden">
        <div className="p-6">
          {/* Search and Buy Button */}
          <SponsorshipSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onBuyClick={openBuyModal}
          />

          {/* Sponsorship Table */}
          <div className="mt-6">
            {sponsorships.length > 0 ? (
              <SponsorshipTable sponsorships={sponsorships} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 font-medium">
                  No sponsorships found yet
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Start by buying your first lesson bundle
                </p>
              </div>
            )}
          </div>

          {/* Pagination (placeholder) */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500">
              Page <span className="text-gray-900">1</span> of{" "}
              <span className="text-gray-900">
                {Math.ceil(sponsorships.length / 10) || 1}
              </span>
            </p>
            <div className="flex space-x-3">
              <button className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                Previous
              </button>
              <button className="px-6 py-2 bg-blue-500/10 text-blue-500 border border-transparent rounded-lg text-xs font-semibold hover:bg-blue-500/20 disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Buy Lesson Bundles Modal */}
      <BuyLessonBundlesModal
        isOpen={isBuyModalOpen}
        onClose={closeBuyModal}
        modalStep={modalStep}
        selectedTier={selectedTier}
        onTierChange={setSelectedTier}
        selectedAmount={selectedAmount}
        onAmountChange={setSelectedAmount}
        customAmount={customAmount}
        onCustomAmountChange={setCustomAmount}
        onProceed={proceedToNextStep}
        onAward={proceedToAwardStep}
        students={students}
        selectedStudents={selectedStudents}
        onStudentToggle={toggleStudentSelection}
      />
    </div>
  );
}

export default SponsorshipSection;
