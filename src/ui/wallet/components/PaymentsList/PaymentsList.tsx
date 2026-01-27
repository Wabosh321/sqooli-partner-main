/**
 * UI Components: Payments List Orchestrator
 * Delegates to mobile or desktop view based on breakpoint
 */

import React from "react";
import { useDeviceSize } from "../../../../hooks/useDeviceSize";
import type { Transaction } from "../../../../domain/wallet";
import { PaymentsListMobile } from "./PaymentsList.mobile";
import { PaymentsListDesktop } from "./PaymentsList.desktop";

export interface PaymentsListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onViewDetails?: (transactionId: string) => void;
}

export function PaymentsList({
  transactions,
  isLoading,
  onViewDetails,
}: PaymentsListProps) {
  const { isMobile } = useDeviceSize();

  if (isMobile) {
    return <PaymentsListMobile transactions={transactions} onViewDetails={onViewDetails} />;
  }

  return (
    <PaymentsListDesktop
      transactions={transactions}
      onViewDetails={onViewDetails}
    />
  );
}
