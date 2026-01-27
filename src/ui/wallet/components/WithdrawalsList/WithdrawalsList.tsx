/**
 * UI Components: Withdrawals List Orchestrator
 * Delegates to mobile or desktop view based on breakpoint
 */

import React from "react";
import { useDeviceSize } from "../../../../hooks/useDeviceSize";
import type { Withdrawal } from "../../../../domain/wallet";
import { WithdrawalsListMobile } from "./WithdrawalsList.mobile";
import { WithdrawalsListDesktop } from "./WithdrawalsList.desktop";

export interface WithdrawalsListProps {
  withdrawals: Withdrawal[];
  isLoading?: boolean;
  onViewDetails?: (withdrawalId: string) => void;
}

export function WithdrawalsList({
  withdrawals,
  isLoading,
  onViewDetails,
}: WithdrawalsListProps) {
  const { isMobile } = useDeviceSize();

  if (isMobile) {
    return (
      <WithdrawalsListMobile withdrawals={withdrawals} onViewDetails={onViewDetails} />
    );
  }

  return (
    <WithdrawalsListDesktop
      withdrawals={withdrawals}
      onViewDetails={onViewDetails}
    />
  );
}
