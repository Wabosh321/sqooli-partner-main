/**
 * UI Components: Payments List Mobile View
 */

import React from "react";
import { Eye } from "lucide-react";
import { Card, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { maskPhoneNumber } from "../../../../lib/maskPhoneNumber";
import type { Transaction } from "../../../../domain/wallet";
import {
  formatDate,
  formatCurrency,
  getStatusBadgeVariant,
} from "../../formatters";

export interface PaymentsListMobileProps {
  transactions: Transaction[];
  onViewDetails?: (transactionId: string) => void;
}

export function PaymentsListMobile({ transactions, onViewDetails }: PaymentsListMobileProps) {
  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <Card key={transaction._id} className="border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {transaction.student_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {maskPhoneNumber(transaction.phone_number)}
                </div>
              </div>
              <Badge
                variant={getStatusBadgeVariant(transaction.status)}
                className="capitalize shrink-0"
              >
                {transaction.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-border">
              <div>
                <div className="text-xs text-muted-foreground mb-1">M-Pesa Code</div>
                <div className="font-mono text-sm text-foreground truncate">
                  {transaction.mpesa_code}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Amount</div>
                <div className="text-sm font-semibold text-foreground">
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Campaign</div>
                <div className="text-sm text-foreground truncate">
                  {transaction.campaign_code}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Date</div>
                <div className="text-xs text-foreground">
                  {formatDate(transaction.created_at)}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => onViewDetails?.(transaction._id)}
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
