import { useState, useEffect } from "react";
import type { Student } from "../types/sponsorship.types";

export function useSponsorshipStudents(enabled: boolean = true) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        // Mock data - replace with actual API call
        const mockStudents: Student[] = [
          {
            id: "S001",
            name: "John Doe",
            gender: "Male",
            dob: "01-01-2010",
            email: "john.doe@gmail.com",
            phone: "0700 000 001",
            kin: "Jane Doe",
            relationship: "Mother",
            kinEmail: "jane.doe@gmail.com",
          },
          {
            id: "S002",
            name: "Mary Johnson",
            gender: "Female",
            dob: "15-05-2009",
            email: "mary.johnson@gmail.com",
            phone: "0700 000 002",
            kin: "Robert Johnson",
            relationship: "Father",
            kinEmail: "robert.johnson@gmail.com",
          },
          {
            id: "S003",
            name: "Peter Smith",
            gender: "Male",
            dob: "22-03-2011",
            email: "peter.smith@gmail.com",
            phone: "0700 000 003",
            kin: "Elizabeth Smith",
            relationship: "Mother",
            kinEmail: "elizabeth.smith@gmail.com",
          },
          {
            id: "S004",
            name: "Sarah Williams",
            gender: "Female",
            dob: "08-07-2010",
            email: "sarah.williams@gmail.com",
            phone: "0700 000 004",
            kin: "Michael Williams",
            relationship: "Father",
            kinEmail: "michael.williams@gmail.com",
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
  }, [enabled]);

  return { students, loading, error };
}
