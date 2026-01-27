import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import type { OnboardingStepProps } from "../types";

export function UsersStep({
  step,
  partner,
  onComplete,
  isActive,
}: OnboardingStepProps) {
  return (
    <Dialog open={isActive} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{step.description}</p>
          <p className="text-sm text-gray-500">
            This feature is coming soon. You can continue with the remaining steps.
          </p>
          <Button onClick={onComplete} className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
