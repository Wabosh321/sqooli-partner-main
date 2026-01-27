import { StepItem } from "./StepItem";
import type { OnboardingStep } from "./types";

interface StepsListProps {
  steps: OnboardingStep[];
  onStepAction: (stepId: number) => void;
}

export function StepsList({ steps, onStepAction }: StepsListProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {steps.map((step, index) => (
        <StepItem
          key={step.id}
          step={step}
          index={index}
          totalSteps={steps.length}
          onAction={onStepAction}
        />
      ))}
    </div>
  );
}
