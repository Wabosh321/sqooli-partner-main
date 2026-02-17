import { useState, useEffect } from "react";
import type { SponsorshipEntry } from "../types/sponsorship.types";

export function useSponsorshipList(enabled: boolean = true) {
  const [sponsorships, setSponsorships] = useState<SponsorshipEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchSponsorships = async () => {
      setLoading(true);
      try {
        // Mock data - replace with actual API call
        const mockSponsorships: SponsorshipEntry[] = [
          {
            id: "1",
            referenceNo: "12345",
            name: "Britam at 20 Scholarship",
            beneficiariesCount: 25,
          },
          {
            id: "2",
            referenceNo: "12346",
            name: "Employee Support Scholarships",
            beneficiariesCount: 25,
          },
          {
            id: "3",
            referenceNo: "12347",
            name: "Educational Excellence Fund",
            beneficiariesCount: 30,
          },
          {
            id: "4",
            referenceNo: "12348",
            name: "Community Development Program",
            beneficiariesCount: 20,
          },
          {
            id: "5",
            referenceNo: "12349",
            name: "Future Leaders Initiative",
            beneficiariesCount: 35,
          },
          {
            id: "6",
            referenceNo: "12350",
            name: "STEM Advancement Fund",
            beneficiariesCount: 28,
          },
        ];
        setSponsorships(mockSponsorships);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch sponsorships:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch sponsorships",
        );
        setSponsorships([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsorships();
  }, [enabled]);

  return { sponsorships, loading, error };
}
