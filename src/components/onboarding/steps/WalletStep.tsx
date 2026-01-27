import { WalletSetupDialog } from "../../common/WalletSetUp";
import type { OnboardingStepProps } from "../types";

export function WalletStep({
  step,
  partner,
  onComplete,
  isActive,
}: OnboardingStepProps) {
  return (
    <WalletSetupDialog
      open={isActive}
      onClose={onComplete}
      onWalletCreated={onComplete}
      partnerId={partner?._id as string}
      userId={partner?.user_id}
    />
  );
}
