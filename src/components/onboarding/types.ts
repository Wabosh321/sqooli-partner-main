// Shared types for onboarding module

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  status: "completed" | "active" | "pending";
}

export interface OnboardingStepProps {
  step: OnboardingStep;
  partner: any; // Use any for flexibility with Convex/Supabase data
  onComplete: () => void | Promise<void>;
  isActive: boolean;
}

export interface StepActionProps {
  status: "completed" | "active" | "pending";
  stepId: number;
  onAction: () => void;
}
