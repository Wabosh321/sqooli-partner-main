/**
 * UI Components: Withdrawals List Mobile View
 */

import React from "react";
import { Eye, Copy } from "lucide-react";
import { Card, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { toast } from "sonner";
import type { Withdrawal } from "../../../../domain/wallet";
import {
  formatCreationTime,
  formatCurrency,
  getStatusBadgeVariant,
  getWithdrawalStatusIcon,
  getWithdrawalMethodDisplay,
} from "../../formatters";

export interface WithdrawalsListMobileProps {
  withdrawals: Withdrawal[];
  onViewDetails?: (withdrawalId: string) => void;
}

export function WithdrawalsListMobile({ withdrawals, onViewDetails }: WithdrawalsListMobileProps) {
  const handleCopy = (receipt: string) => {
    navigator.clipboard.writeText(receipt);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-3">
      {withdrawals.map((withdrawal) => (
        <Card key={withdrawal._id} className="border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {getWithdrawalStatusIcon(withdrawal.status)}
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-foreground">
                    {withdrawal.reference_number}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getWithdrawalMethodDisplay(withdrawal.withdrawal_method)}
                  </div>
                </div>
              </div>
              <Badge
                variant={getStatusBadgeVariant(withdrawal.status)}
                className="capitalize shrink-0"
              >
                {withdrawal.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-border">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Amount</div>
                <div className="text-sm font-semibold text-foreground">
                  {formatCurrency(withdrawal.amount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Account</div>
                <div className="text-sm text-foreground font-mono truncate">
                  {withdrawal.destination_details.account_number}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Date Requested</div>
                <div className="text-xs text-foreground">
                  {formatCreationTime(withdrawal._creationTime)}
                </div>
              </div>
              {withdrawal.mpesa_receipt && (
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">M-Pesa Receipt</div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-foreground font-mono">
                      {withdrawal.mpesa_receipt}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(withdrawal.mpesa_receipt!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => onViewDetails?.(withdrawal._id)}
            >
              <Eye className="h-4 w-4" />
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
