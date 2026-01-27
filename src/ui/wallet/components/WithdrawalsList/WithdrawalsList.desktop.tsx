/**
 * UI Components: Withdrawals List Desktop View
 */

import React from "react";
import { Eye, Copy } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import type { Withdrawal } from "../../../../domain/wallet";
import {
  formatDate,
  formatCreationTime,
  formatCurrency,
  getStatusBadgeVariant,
  getWithdrawalStatusIcon,
  getWithdrawalMethodDisplay,
} from "../../formatters";

export interface WithdrawalsListDesktopProps {
  withdrawals: Withdrawal[];
  onViewDetails?: (withdrawalId: string) => void;
}

export function WithdrawalsListDesktop({
  withdrawals,
  onViewDetails,
}: WithdrawalsListDesktopProps) {
  const handleCopy = (receipt: string) => {
    navigator.clipboard.writeText(receipt);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="text-muted-foreground font-medium">Reference</TableHead>
            <TableHead className="text-muted-foreground font-medium">Method</TableHead>
            <TableHead className="text-muted-foreground font-medium">Account</TableHead>
            <TableHead className="text-muted-foreground font-medium">Amount</TableHead>
            <TableHead className="text-muted-foreground font-medium">Date</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-muted-foreground font-medium">Receipt</TableHead>
            <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {withdrawals.map((withdrawal) => (
            <TableRow key={withdrawal._id} className="border-border hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2">
                  {getWithdrawalStatusIcon(withdrawal.status)}
                  <div className="font-mono text-sm text-foreground">
                    {withdrawal.reference_number}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-foreground">
                  {getWithdrawalMethodDisplay(withdrawal.withdrawal_method)}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-mono text-sm text-foreground">
                  {withdrawal.destination_details.account_number}
                </div>
                {withdrawal.destination_details.bank_name && (
                  <div className="text-xs text-muted-foreground">
                    {withdrawal.destination_details.bank_name}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="font-semibold text-foreground">
                  {formatCurrency(withdrawal.amount)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {formatCreationTime(withdrawal._creationTime)}
                </div>
                {withdrawal.processed_at && (
                  <div className="text-xs text-muted-foreground">
                    Processed: {formatDate(withdrawal.processed_at)}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={getStatusBadgeVariant(withdrawal.status)}
                  className="capitalize"
                >
                  {withdrawal.status}
                </Badge>
              </TableCell>
              <TableCell>
                {withdrawal.mpesa_receipt ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground">
                      {withdrawal.mpesa_receipt}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(withdrawal.mpesa_receipt!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    title="View details"
                    onClick={() => onViewDetails?.(withdrawal._id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
