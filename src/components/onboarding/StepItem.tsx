import { ReactNode } from "react";
import { StepProgressIndicator } from "./StepProgressIndicator";
import { StepAction } from "./StepAction";
import type { OnboardingStep } from "./types";

interface StepItemProps {
  step: OnboardingStep;
  index: number;
  totalSteps: number;
  onAction: (stepId: number) => void;
}

export function StepItem({
  step,
  index,
  totalSteps,
  onAction,
}: StepItemProps) {
  const isLastStep = index === totalSteps - 1;

  return (
    <div
      className={`flex items-center gap-6 px-6 py-4 ${
        !isLastStep ? "border-b border-gray-200" : ""
      }`}
      style={{ minHeight: "90px" }}
    >
      {/* Status Indicator */}
      <div className="flex-shrink-0">
        <StepProgressIndicator status={step.status} stepId={step.id} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
      </div>

      {/* Action */}
      <div className="flex-shrink-0">
        <StepAction
          status={step.status}
          stepId={step.id}
          onAction={() => onAction(step.id)}
        />
      </div>
    </div>
  );
}
