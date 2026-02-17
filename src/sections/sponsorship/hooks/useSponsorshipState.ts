import { useState, useCallback } from "react";
import type { ModalStep, BundleTier } from "../types/sponsorship.types";

export function useSponsorshipState() {
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("package");
  const [selectedTier, setSelectedTier] = useState<BundleTier>(1);
  const [selectedAmount, setSelectedAmount] =
    useState<string>("KES 250,000.00");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>(
    [] as string[],
  );
  const [searchQuery, setSearchQuery] = useState("");

  const openBuyModal = useCallback(() => {
    setIsBuyModalOpen(true);
    setModalStep("package");
  }, []);

  const closeBuyModal = useCallback(() => {
    setIsBuyModalOpen(false);
    setSelectedAmount("KES 250,000.00");
    setCustomAmount("");
    setSelectedTier(1);
    setSelectedStudents([]);
  }, []);

  const proceedToNextStep = useCallback(() => {
    if (modalStep === "package") setModalStep("payment");
    else if (modalStep === "payment") setModalStep("pin");
    else if (modalStep === "pin") {
      setTimeout(() => setModalStep("success"), 1500);
    }
  }, [modalStep]);

  const proceedToAwardStep = useCallback(() => {
    setModalStep("award");
  }, []);

  const toggleStudentSelection = useCallback((studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  }, []);

  return {
    isBuyModalOpen,
    modalStep,
    selectedTier,
    selectedAmount,
    customAmount,
    selectedStudents,
    searchQuery,
    setSelectedTier,
    setSelectedAmount,
    setCustomAmount,
    setSearchQuery,
    openBuyModal,
    closeBuyModal,
    proceedToNextStep,
    proceedToAwardStep,
    toggleStudentSelection,
  };
}
