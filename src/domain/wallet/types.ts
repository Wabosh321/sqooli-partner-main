/**
 * Domain Layer: Type Definitions
 * Pure TypeScript interfaces for Wallet domain
 */

export type TransactionStatus =
  | "verified"
  | "completed"
  | "pending"
  | "processing"
  | "failed"
  | "rejected"
  | "cancelled";

export type WithdrawalStatus = TransactionStatus;

export type WithdrawalMethod = "mpesa" | "bank" | "paybill";

export interface Campaign {
  _id: string;
  partner_id: string;
  code: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface Transaction {
  _id: string;
  partner_id: string;
  student_name: string;
  phone_number: string;
  mpesa_code: string;
  campaign_code: string;
  amount: number;
  status: TransactionStatus;
  created_at: string;
  verified_at?: string;
}

export interface Withdrawal {
  _id: string;
  partner_id: string;
  reference_number: string;
  withdrawal_method: WithdrawalMethod;
  amount: number;
  destination_details: {
    account_number: string;
    bank_name?: string;
  };
  status: WithdrawalStatus;
  mpesa_receipt?: string;
  _creationTime: number;
  processed_at?: string;
}

export interface WalletDataState {
  campaigns: Campaign[] | undefined;
  transactions: Transaction[] | undefined;
  withdrawals: Withdrawal[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export interface FilteredResults {
  transactions: Transaction[];
  withdrawals: Withdrawal[];
}
