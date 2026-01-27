import { ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import type { StepActionProps } from "./types";

export function StepAction({ status, stepId, onAction }: StepActionProps) {
  if (status === "active") {
    return (
      <div className="flex items-center gap-2">
        {stepId === 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full px-6 text-gray-600 hover:text-gray-900"
            onClick={onAction}
          >
            Skip
          </Button>
        )}
        <Button
          size="sm"
          className="rounded-full bg-blue-500 px-6 hover:bg-blue-600 text-white"
          onClick={onAction}
        >
          Go
        </Button>
      </div>
    );
  }

  return <ChevronRight className="h-5 w-5 text-gray-400" />;
}
