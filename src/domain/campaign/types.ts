export interface BundledOffers {
  min_lessons?: number;
}

export interface Campaign {
  _id: string;
  name?: string;
  promo_code?: string;
  duration_start?: string;
  duration_end?: string;
  target_signups?: number;
  bundled_offers?: BundledOffers;
  status?: string;
}

export type CampaignStatus = 'active' | 'expired' | 'draft' | string;
