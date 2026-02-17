export interface SponsorshipEntry {
  id: string;
  referenceNo: string;
  name: string;
  beneficiariesCount: number;
}

export interface Student {
  id: string;
  name: string;
  gender: "Male" | "Female";
  dob: string;
  email: string;
  phone: string;
  kin: string;
  relationship: string;
  kinEmail: string;
}

export interface SponsorshipMetrics {
  totalSlots: number;
  claimedSlots: number;
  pendingClaim: number;
  availableSlots: number;
}

export type BundleTier = 1 | 2 | 3;

export interface BundlePackage {
  tier: BundleTier;
  label: string;
  description: string;
  amounts: string[];
}

export type ModalStep =
  | "package"
  | "payment"
  | "pin"
  | "success"
  | "failed"
  | "award";
