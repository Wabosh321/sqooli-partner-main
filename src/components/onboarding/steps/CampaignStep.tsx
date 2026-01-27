import CreateCampaignWizard from "../../common/CreateCampaign";
import type { OnboardingStepProps } from "../types";

export function CampaignStep({
  step,
  partner,
  onComplete,
  isActive,
}: OnboardingStepProps) {
  return (
    <CreateCampaignWizard
      open={isActive}
      onClose={onComplete}
      partnerId={partner?._id}
      user_id={partner?.user_id}
    />
  );
}
