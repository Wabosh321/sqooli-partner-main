import { useState, useEffect } from "react";
import type { BeneficiaryListEntry } from "../types/beneficiary.types";

export function useBeneficiaryLists(enabled: boolean = true) {
  const [lists, setLists] = useState<BeneficiaryListEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchLists = async () => {
      setLoading(true);
      try {
        // Mock data - replace with actual API call
        const mockLists: BeneficiaryListEntry[] = [
          {
            id: "1",
            dateCreated: "13 Jan 2025 11.00 AM",
            name: "Children of Employees",
            beneficiariesCount: 276,
            status: "Active",
            createdBy: "Jane Doe",
          },
          {
            id: "2",
            dateCreated: "14 Jan 2025 11.00 AM",
            name: "Employees",
            beneficiariesCount: 276,
            status: "Active",
            createdBy: "Jane Doe",
          },
          {
            id: "3",
            dateCreated: "15 Jan 2025 11.00 AM",
            name: "Employees",
            beneficiariesCount: 276,
            status: "Active",
            createdBy: "Jane Doe",
          },
        ];
        setLists(mockLists);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch beneficiary lists:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch lists");
        setLists([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, [enabled]);

  return { lists, loading, error };
}
