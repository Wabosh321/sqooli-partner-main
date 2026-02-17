import { useState, useEffect } from "react";
import type { Student } from "../types/beneficiary.types";

export function useBeneficiaryStudents(
  listId: string | null,
  enabled: boolean = true,
) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !listId) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        // Mock data - replace with actual API call
        const mockStudents: Student[] = [
          {
            id: "C102",
            name: "John Doe",
            dateAdded: "12 Jan 2025 11.00 PM",
            curriculum: "CBC",
            lessonsAwarded: 48,
            lessonsUsed: 26,
            lessonsRemaining: 22,
            status: "Active",
          },
          {
            id: "C103",
            name: "Jane Smith",
            dateAdded: "12 Jan 2025 11.00 PM",
            curriculum: "Cambridge",
            lessonsAwarded: 48,
            lessonsUsed: 26,
            lessonsRemaining: 22,
            status: "Active",
          },
          {
            id: "C104",
            name: "Bob Johnson",
            dateAdded: "12 Jan 2025 11.00 PM",
            curriculum: "8-4-4",
            lessonsAwarded: 48,
            lessonsUsed: 26,
            lessonsRemaining: 22,
            status: "Active",
          },
        ];
        setStudents(mockStudents);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch students",
        );
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [listId, enabled]);

  return { students, loading, error };
}
