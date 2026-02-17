export interface BeneficiaryListEntry {
  id: string;
  dateCreated: string;
  name: string;
  beneficiariesCount: number;
  description?: string;
  status: "Active" | "Inactive";
  createdBy: string;
}

export interface Student {
  id: string;
  name: string;
  dateAdded: string;
  curriculum: string;
  lessonsAwarded: number;
  lessonsUsed: number;
  lessonsRemaining: number;
  status: "Active" | "Inactive";
}

export interface StudentBundle {
  id: string;
  dateAwarded: string;
  referenceNo: string;
  lessonsAwarded: number;
  lessonsUsed: number;
  lessonsRemaining: number;
  status: "Pending" | "Claimed";
  expiryDays: number | string;
}

export interface BeneficiaryMetrics {
  totalLessons: number;
  claimed: number;
  pendingClaim: number;
}
