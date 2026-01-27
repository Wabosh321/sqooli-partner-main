/**
 * UI Components: Empty State
 * Reusable empty state for tables
 */

import React from "react";
import { ArrowDownToLine } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  iconType?: "payments" | "withdrawals";
}

export function EmptyState({ title, description, icon, iconType }: EmptyStateProps) {
  const renderIcon = () => {
    if (icon) return icon;

    if (iconType === "withdrawals") {
      return <ArrowDownToLine className="w-10 h-10 lg:w-12 lg:h-12 text-muted-foreground" />;
    }

    // Default payments icon (SVG)
    return (
      <svg
        className="w-10 h-10 lg:w-12 lg:h-12 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  };

  return (
    <div className="text-center py-8 lg:py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-muted flex items-center justify-center">
          {renderIcon()}
        </div>
        <div className="space-y-1 text-center px-4">
          <div className="text-sm lg:text-base text-muted-foreground font-medium">{title}</div>
          {description && (
            <div className="text-xs lg:text-sm text-muted-foreground">{description}</div>
          )}
        </div>
      </div>
    </div>
  );
}
