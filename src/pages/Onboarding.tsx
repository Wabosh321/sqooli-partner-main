import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { isConvexUser } from "../types/auth.types";
import { completePartnerOnboarding } from "../utils/verifyAuthData";
import { StepsList } from "../components/onboarding/StepsList";
import { useStepProgression } from "../components/onboarding/hooks/useStepProgression";
import { useOnboardingData } from "../components/onboarding/hooks/useOnboardingData";
import { WalletStep } from "../components/onboarding/steps/WalletStep";
import { CampaignStep } from "../components/onboarding/steps/CampaignStep";
import { UsersStep } from "../components/onboarding/steps/UsersStep";
import { TwoFactorStep } from "../components/onboarding/steps/TwoFactorStep";
import { SocialMediaStep } from "../components/onboarding/steps/SocialMediaStep";
import type { OnboardingStep } from "../components/onboarding/types";

export default function OnboardingPage() {
  const [activeStepId, setActiveStepId] = useState<number | null>(null);
  const { partner, user, loading: authLoading, refetch } = useAuth();
  const hasTriedAutoComplete = useRef(false);

  // Data hooks
  const { wallet, campaign, loading: dataLoading, refetch: refetchData } =
    useOnboardingData({ partnerId: partner?._id });
  const { buildSteps } = useStepProgression({ partner });

  // Skip onboarding for admins
  useEffect(() => {
    if (authLoading) return;
    if (user && isConvexUser(user) && user.role === "super_admin") {
      return;
    }
  }, [user, authLoading]);

  // Complete onboarding when all steps done
  const handleCompleteOnboarding = async () => {
    if (!partner?._id) {
      console.error("❌ No partner ID available");
      return;
    }

    try {
      console.log("📝 Completing onboarding for partner:", partner._id);
      const updatedPartner = await completePartnerOnboarding(partner._id);

      if (updatedPartner?.onboarding_completed) {
        console.log("✅ Onboarding completed successfully");
        if (refetch) {
          console.log("🔄 Refreshing auth context...");
          await refetch();
        }
      } else {
        console.error("❌ Failed to confirm onboarding completion");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  // Auto-complete if all required steps are done
  useEffect(() => {
    if (!partner || dataLoading || authLoading) return;

    if (hasTriedAutoComplete.current) {
      console.log("⏭️ Already attempted auto-complete, skipping");
      return;
    }

    const allStepsComplete =
      partner.wallet_setup_completed === true &&
      partner.campaign_created === true;

    const stillNeedsCompletion = partner.onboarding_completed !== true;

    if (allStepsComplete && stillNeedsCompletion) {
      console.log("🎯 All required steps complete, auto-completing onboarding");
      hasTriedAutoComplete.current = true;
      handleCompleteOnboarding();
    }
  }, [partner?.id, dataLoading, authLoading]);

  // Handle step completion
  const handleStepComplete = async () => {
    console.log(`✅ Step ${activeStepId} completed`);
    await refetchData();
    if (refetch) {
      await refetch();
    }
    setActiveStepId(null);
  };

  // Handle step action
  const handleStepAction = (stepId: number) => {
    setActiveStepId(stepId);
  };

  const steps = buildSteps();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">
            Welcome to Sqooli
          </h1>
          <p className="text-gray-600">
            Complete the following steps to activate your profile
          </p>
        </div>

        {/* Steps List */}
        <StepsList steps={steps} onStepAction={handleStepAction} />
      </div>

      {/* Step Modals */}
      {partner && user && isConvexUser(user) && (
        <>
          <WalletStep
            step={steps[0]}
            partner={partner}
            onComplete={handleStepComplete}
            isActive={activeStepId === 1}
          />
          <CampaignStep
            step={steps[1]}
            partner={partner}
            onComplete={handleStepComplete}
            isActive={activeStepId === 2}
          />
          <UsersStep
            step={steps[2]}
            partner={partner}
            onComplete={handleStepComplete}
            isActive={activeStepId === 3}
          />
          <TwoFactorStep
            step={steps[3]}
            partner={partner}
            onComplete={handleStepComplete}
            isActive={activeStepId === 4}
          />
          <SocialMediaStep
            step={steps[4]}
            partner={partner}
            onComplete={handleStepComplete}
            isActive={activeStepId === 5}
          />
        </>
      )}
    </div>
  );
}
