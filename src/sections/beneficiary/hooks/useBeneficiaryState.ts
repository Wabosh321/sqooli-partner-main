import { useState, useCallback } from "react";
import type { BeneficiaryListEntry, Student } from "../types/beneficiary.types";

export function useBeneficiaryState() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Active" | "Inactive">("Active");
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const closeListDetails = useCallback(() => {
    setSelectedListId(null);
  }, []);

  const openNewListModal = useCallback(() => {
    setIsNewListModalOpen(true);
  }, []);

  const closeNewListModal = useCallback(() => {
    setIsNewListModalOpen(false);
  }, []);

  const selectList = useCallback((listId: string) => {
    setSelectedListId(listId);
  }, []);

  const selectStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
  }, []);

  const clearSelectedStudent = useCallback(() => {
    setSelectedStudent(null);
  }, []);

  return {
    selectedListId,
    activeTab,
    isNewListModalOpen,
    selectedStudent,
    searchQuery,
    setActiveTab,
    setSearchQuery,
    closeListDetails,
    openNewListModal,
    closeNewListModal,
    selectList,
    selectStudent,
    clearSelectedStudent,
  };
}
