import { useCallback } from "react";
import type { OnboardingStep } from "../types"; // ← fixed path

interface UseStepProgressionProps {
  partner: any;
}

export function useStepProgression({ partner }: UseStepProgressionProps) {
  const getStepStatus = useCallback(
    (stepId: number): "completed" | "active" | "pending" => {
      if (!partner) return stepId === 1 ? "active" : "pending";

      switch (stepId) {
        case 1:
          return partner.wallet_setup_completed ? "completed" : "active";
        case 2:
          return partner.campaign_created
            ? "completed"
            : partner.wallet_setup_completed
            ? "active"
            : "pending";
        case 3:
          return partner.users_added
            ? "completed"
            : partner.campaign_created
            ? "active"
            : "pending";
        case 4:
          return partner.two_factor_setup_completed
            ? "completed"
            : partner.users_added
            ? "active"
            : "pending";
        case 5:
          return partner.social_media_added
            ? "completed"
            : partner.two_factor_setup_completed
            ? "active"
            : "pending";
        default:
          return "pending";
      }
    },
    [partner]
  );

  const buildSteps = useCallback((): OnboardingStep[] => {
    return [
      { id: 1, title: "Setup Wallet", description: "Setup your wallet payment methods for future withdrawals of your earnings", status: getStepStatus(1) },
      { id: 2, title: "Create Campaign", description: "Create a campaign and share with your audience to start earning", status: getStepStatus(2) },
      { id: 3, title: "Add Users", description: "Invite other users with different roles to your account", status: getStepStatus(3) },
      { id: 4, title: "Two Factor Authentication Setup", description: "Setup your contact details for two factor authentication", status: getStepStatus(4) },
      { id: 5, title: "Social Media Links (optional)", description: "Setup your social media links to grow your audience", status: getStepStatus(5) },
    ];
  }, [getStepStatus]);

  return { getStepStatus, buildSteps };
}
