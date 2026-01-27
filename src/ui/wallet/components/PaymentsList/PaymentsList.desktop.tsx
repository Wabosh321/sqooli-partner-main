/**
 * UI Components: Payments List Desktop View
 */

import React from "react";
import { Eye } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { maskPhoneNumber } from "../../../../lib/maskPhoneNumber";
import type { Transaction } from "../../../../domain/wallet";
import {
  formatDate,
  formatCurrency,
  getStatusBadgeVariant,
} from "../../formatters";

export interface PaymentsListDesktopProps {
  transactions: Transaction[];
  onViewDetails?: (transactionId: string) => void;
}

export function PaymentsListDesktop({ transactions, onViewDetails }: PaymentsListDesktopProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="text-muted-foreground font-medium">Student</TableHead>
            <TableHead className="text-muted-foreground font-medium">Phone</TableHead>
            <TableHead className="text-muted-foreground font-medium">M-Pesa Code</TableHead>
            <TableHead className="text-muted-foreground font-medium">Campaign</TableHead>
            <TableHead className="text-muted-foreground font-medium">Amount</TableHead>
            <TableHead className="text-muted-foreground font-medium">Date</TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
            <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction._id} className="border-border hover:bg-muted/50">
              <TableCell>
                <div className="font-medium text-foreground">{transaction.student_name}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-foreground">
                  {maskPhoneNumber(transaction.phone_number)}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-mono text-sm text-foreground">{transaction.mpesa_code}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-foreground">{transaction.campaign_code}</div>
              </TableCell>
              <TableCell>
                <div className="font-semibold text-foreground">
                  {formatCurrency(transaction.amount)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {formatDate(transaction.created_at)}
                </div>
                {transaction.verified_at && (
                  <div className="text-xs text-muted-foreground">
                    Verified: {formatDate(transaction.verified_at)}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={getStatusBadgeVariant(transaction.status)}
                  className="capitalize"
                >
                  {transaction.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    title="View details"
                    onClick={() => onViewDetails?.(transaction._id)}
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
