import { Check, ChevronRight } from "lucide-react";

interface StepProgressIndicatorProps {
  status: "completed" | "active" | "pending";
  stepId: number;
}

export function StepProgressIndicator({
  status,
  stepId,
}: StepProgressIndicatorProps) {
  if (status === "completed") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
        <Check className="h-6 w-6 text-white" strokeWidth={3} />
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-50 text-lg font-semibold text-blue-600">
        {stepId}
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-medium text-gray-500">
      {stepId}
    </div>
  );
}
