/**
 * UI Layer: Wallet Section Orchestrator
 * Coordinates permissions, data, and component routing
 */

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { usePartnerAccess } from "../hooks/usePartnerAccess";
import { useDeviceSize } from "../hooks/useDeviceSize";
import { Loading } from "../components/common/Loading";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AlertCircle, Wallet as WalletIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../components/ui/sheet";
import SuperAdminWalletSection from "../components/common/SuperAdminWalletSection";
import Wallet from "../components/common/Wallet";
import { useWalletData } from "../application/wallet/useWalletData";
import { useWalletFiltering } from "../application/wallet/useWalletFiltering";
import {
  PaymentsList,
  WithdrawalsList,
  WalletHeader,
  EmptyState,
} from "../ui/wallet/components";
import { DASHBOARD_SECTION_CONFIG, getResponsivePadding, getSectionContainerStyle } from "./SettingsSection";

interface WalletSectionProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

/**
 * WalletSection: Main orchestrator component
 * Handles:
 * - Permission checks
 * - Data fetching orchestration
 * - State management (search, tabs)
 * - Conditional routing (SuperAdmin, permissions, loading)
 * - Layout management (mobile drawer, desktop sidebar)
 */
export default function WalletSection({
  activeItem,
  setActiveItem,
}: WalletSectionProps) {
  const { partner } = useAuth();
  const { userRole } = usePermissions();
  const { canAccessWallet } = usePartnerAccess();
  const { isMobile, isTablet } = useDeviceSize();
  const padding = getResponsivePadding(isMobile, isTablet);

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"payments" | "withdrawals">("payments");
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // Derived state
  const isSuperAdmin = userRole === "super_admin";
  const partnerId = (partner as any)?.id ?? (partner as any)?._id;

  // Data fetching
  const walletData = useWalletData(partnerId);
  const { transactions, withdrawals } = useWalletFiltering(walletData, searchQuery);

  // ========== PERMISSION GUARDS ==========

  // Guard: No wallet access
  if (!canAccessWallet && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Access Restricted</h3>
          <p className="text-gray-500 mt-2">
            Your partner tier doesn't include wallet access.
          </p>
        </div>
      </div>
    );
  }

  // Guard: No partner
  if (!partner) {
    return <Loading message="Loading your wallet..." size="lg" />;
  }

  // Guard: Still loading
  if (walletData.isLoading) {
    return <Loading message="Loading transactions..." size="lg" />;
  }

  // Delegate: SuperAdmin gets special view
  if (isSuperAdmin) {
    return <SuperAdminWalletSection />;
  }

  // ========== MAIN RENDER ==========

  return (
    <div style={getSectionContainerStyle(padding)}>
      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Mobile Wallet Toggle */}
        <div className="lg:hidden">
          <Sheet open={isWalletOpen} onOpenChange={setIsWalletOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <WalletIcon className="h-4 w-4" />
                View Wallet
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="p-4">
                <Wallet activeItem={activeItem} setActiveItem={setActiveItem} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Wallet - Left Column */}
        <div className="hidden lg:block lg:w-64 shrink-0">
          <Wallet activeItem={activeItem} setActiveItem={setActiveItem} />
        </div>

        {/* Right Column - Transaction Content */}
        <div className="flex-1 space-y-4 lg:space-y-6 min-w-0">
          {/* Header with Search and Tabs */}
          <WalletHeader
            searchQuery={searchQuery}
            activeTab={activeTab}
            onSearchChange={setSearchQuery}
            onTabChange={setActiveTab}
          />

          {/* Tabs and Table */}
          <Card className="border-border">
            <CardContent className="p-4 lg:pt-6">
              {/* PAYMENTS TAB */}
              {activeTab === "payments" && (
                <>
                  {transactions.length === 0 ? (
                    <EmptyState
                      title="Your completed payments will display here"
                      iconType="payments"
                    />
                  ) : (
                    <>
                      <PaymentsList
                        transactions={transactions}
                        isLoading={walletData.isLoading}
                      />

                      {/* Pagination */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 lg:mt-6 pt-4 border-t border-border">
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Showing {transactions.length} of{" "}
                          {walletData.transactions?.length || 0} payments
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled>
                            Previous
                          </Button>
                          <Button variant="outline" size="sm" disabled>
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* WITHDRAWALS TAB */}
              {activeTab === "withdrawals" && (
                <>
                  {withdrawals.length === 0 ? (
                    <EmptyState
                      title="No withdrawals yet"
                      description="Your withdrawal requests will appear here"
                      iconType="withdrawals"
                    />
                  ) : (
                    <>
                      <WithdrawalsList
                        withdrawals={withdrawals}
                        isLoading={walletData.isLoading}
                      />

                      {/* Pagination */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 lg:mt-6 pt-4 border-t border-border">
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Showing {withdrawals.length} of{" "}
                          {walletData.withdrawals?.length || 0} withdrawals
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled>
                            Previous
                          </Button>
                          <Button variant="outline" size="sm" disabled>
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
