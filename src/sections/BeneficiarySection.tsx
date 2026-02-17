"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { usePartnerAccess } from "../hooks/usePartnerAccess";
import { usePermissions } from "../hooks/usePermission";
import { Loading } from "../components/common/Loading";
import {
  DASHBOARD_SECTION_CONFIG,
  getResponsivePadding,
  getSectionContainerStyle,
} from "./SettingsSection";
import { useDeviceSize } from "../hooks/useDeviceSize";
import { useBeneficiaryState } from "./beneficiary/hooks/useBeneficiaryState";
import { useBeneficiaryLists } from "./beneficiary/hooks/useBeneficiaryLists";
import { useBeneficiaryStudents } from "./beneficiary/hooks/useBeneficiaryStudents";
import { BeneficiaryHeader } from "./beneficiary/components/BeneficiaryHeader";
import { BeneficiaryTabs } from "./beneficiary/components/BeneficiaryTabs";
import { BeneficiarySearch } from "./beneficiary/components/BeneficiarySearch";
import { BeneficiaryListTable } from "./beneficiary/components/BeneficiaryListTable";
import { Pagination } from "./beneficiary/components/Pagination";
import { NewBeneficiaryListModal } from "./beneficiary/components/NewBeneficiaryListModal";
import { BeneficiaryListDetails } from "./beneficiary/components/BeneficiaryListDetails";
import { StudentDetailsModal } from "./beneficiary/components/StudentDetailsModal";
import { Card, CardContent } from "../components/ui/card";

export default function BeneficiarySection() {
  const { isMobile, isTablet } = useDeviceSize();
  const padding = getResponsivePadding(isMobile, isTablet);

  const { canAccessBeneficiaries, partnerType } = usePartnerAccess();
  const { user, partner, loading: authLoading } = useAuth();
  const { canRead, loading: permissionsLoading } = usePermissions();

  const canViewBeneficiaries = canRead("beneficiaries");

  // State management
  const {
    selectedListId,
    activeTab,
    isNewListModalOpen,
    selectedStudent,
    searchQuery,
    setActiveTab,
    setSearchQuery,
    closeListDetails,
    openNewListModal,
    closeNewListModal,
    selectList,
    selectStudent,
    clearSelectedStudent,
  } = useBeneficiaryState();

  // Data fetching
  const { lists, loading: listsLoading } =
    useBeneficiaryLists(canViewBeneficiaries);
  const { students, loading: studentsLoading } = useBeneficiaryStudents(
    selectedListId,
    canViewBeneficiaries,
  );

  // Permission guard
  if (!canAccessBeneficiaries && partnerType) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">
            Access Restricted
          </h3>
          <p className="text-gray-500 mt-2">
            Your partner tier doesn't include beneficiaries access.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (permissionsLoading || !partner || authLoading) {
    return <Loading message="Loading beneficiary management..." size="md" />;
  }

  // Filter lists by active tab
  const filteredLists = lists.filter((list) => {
    const matchesTab = list.status === activeTab;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      list.name.toLowerCase().includes(q) ||
      list.dateCreated.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  // Handle create list
  const handleCreateList = async (data: {
    name: string;
    description: string;
  }) => {
    // Implement API call here
    console.log("Creating list:", data);
    closeNewListModal();
  };

  // Show list details view if a list is selected
  if (selectedListId) {
    return (
      <div
        style={{
          ...getSectionContainerStyle(padding),
          paddingTop: isMobile ? "16px" : "32px",
        }}
      >
        <BeneficiaryListDetails
          listId={selectedListId}
          onBack={closeListDetails}
          students={students}
          onStudentClick={selectStudent}
          loading={studentsLoading}
        />
      </div>
    );
  }

  // Main beneficiary list view
  return (
    <div
      style={{
        ...getSectionContainerStyle(padding),
        paddingTop: isMobile ? "16px" : "32px",
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <BeneficiaryHeader onNewListClick={openNewListModal} />

        {/* Card Container */}
        <Card className="border-gray-100">
          <CardContent className="p-0">
            {/* Tabs */}
            <BeneficiaryTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="p-6">
              {/* Search */}
              <BeneficiarySearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search beneficiary lists..."
              />

              {/* Table */}
              <BeneficiaryListTable
                lists={filteredLists}
                onView={selectList}
                loading={listsLoading}
              />

              {/* Pagination */}
              {filteredLists.length > 0 && (
                <Pagination
                  currentPage={1}
                  totalPages={10}
                  onPrevious={() => {}}
                  onNext={() => {}}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <NewBeneficiaryListModal
        isOpen={isNewListModalOpen}
        onClose={closeNewListModal}
        onCreateList={handleCreateList}
      />

      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={clearSelectedStudent}
        />
      )}
    </div>
  );
}
