// src/sections/dashboard/types/withdrawal.types.ts
export interface WithdrawalRecord {
  _id: string;
  _creationTime: number;
  amount: number;
  status: "completed" | "pending" | "processing";
}

export interface WithdrawalStatsData {
  total_completed: number;
  total_pending: number;
  recent_withdrawals: WithdrawalRecord[];
}
