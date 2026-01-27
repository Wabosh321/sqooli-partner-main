/**
 * UI Layer: Wallet Formatters & Mappers
 * Pure functions for formatting and displaying wallet data
 */

import React from "react";
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import type { TransactionStatus, WithdrawalStatus, WithdrawalMethod } from "../../../domain/wallet";

/**
 * Formats a date string to "DD MMM YYYY HH:MM AM/PM"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Formats a timestamp (ms) to "DD MMM YYYY HH:MM AM/PM"
 */
export function formatCreationTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Formats a currency amount to "KES 1,234.56"
 */
export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return "KES 0.00";
  return `KES ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Maps transaction/withdrawal status to Badge variant
 */
export function getStatusBadgeVariant(
  status: TransactionStatus | WithdrawalStatus
): "default" | "secondary" | "outline" | "destructive" {
  switch (status.toLowerCase()) {
    case "verified":
    case "completed":
      return "default";
    case "pending":
      return "secondary";
    case "processing":
      return "outline";
    case "failed":
    case "rejected":
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

/**
 * Returns icon component for withdrawal status
 */
export function getWithdrawalStatusIcon(status: WithdrawalStatus): React.ReactNode {
  switch (status.toLowerCase()) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "processing":
      return <AlertCircle className="h-4 w-4" />;
    case "failed":
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

/**
 * Maps withdrawal method code to display string
 */
export function getWithdrawalMethodDisplay(method: WithdrawalMethod): string {
  switch (method) {
    case "mpesa":
      return "M-Pesa";
    case "bank":
      return "Bank Transfer";
    case "paybill":
      return "Paybill";
    default:
      return method;
  }
}

/**
 * Copies text to clipboard and shows toast notification
 */
export function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
  // Toast is handled by the component using this function
}
