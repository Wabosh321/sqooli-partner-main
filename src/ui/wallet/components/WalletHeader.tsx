/**
 * UI Components: Wallet Header
 * Search and tab navigation bar
 */

import React from "react";
import { Search, Filter } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export interface WalletHeaderProps {
  searchQuery: string;
  activeTab: "payments" | "withdrawals";
  onSearchChange: (query: string) => void;
  onTabChange: (tab: "payments" | "withdrawals") => void;
}

export function WalletHeader({
  searchQuery,
  activeTab,
  onSearchChange,
  onTabChange,
}: WalletHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
      {/* Tab Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => onTabChange("payments")}
          className={`text-sm font-medium p-2 transition-colors ${
            activeTab === "payments"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
          }`}
        >
          Payments
        </button>
        <button
          onClick={() => onTabChange("withdrawals")}
          className={`text-sm font-medium p-2 transition-colors ${
            activeTab === "withdrawals"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
          }`}
        >
          Withdrawals
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === "payments" ? "Search transactions..." : "Search withdrawals..."}
            className="pl-10 bg-background border-border w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0 w-full sm:w-auto">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
