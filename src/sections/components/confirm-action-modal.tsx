"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "../../components/ui/dialog";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  action: "approve" | "decline";
  referenceNo?: string;
  reasonText: string;
  onReasonChange: (text: string) => void;
  onConfirm: () => void;
  onModalOpen?: () => void; // Callback when modal opens, for parent to close task-details-modal
}

export default function ConfirmActionModal({
  isOpen,
  onOpenChange,
  action,
  referenceNo,
  reasonText,
  onReasonChange,
  onConfirm,
  onModalOpen,
}: ConfirmActionModalProps) {
  const isDecline = action === "decline";
  const modalHeight = isDecline ? 357 : 195;

  // When this modal opens, notify parent to close task-details-modal
  useEffect(() => {
    if (isOpen && onModalOpen) {
      onModalOpen();
    }
  }, [isOpen, onModalOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Backdrop overlay - only renders when modal is open, above task-details backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-55" />
      )}

      {/* Modal container - above task-details-modal */}
      <DialogContent
        className="fixed z-[65] border-0 shadow-lg p-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "497px",
          height: `${modalHeight}px`,
          borderRadius: "24px",
          padding: "0px",
          background: "#FFFFFF",
          opacity: 1,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "24px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div className="flex flex-row items-start justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isDecline ? "Decline Task" : "Approve Task"}
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              flex: 1,
            }}
          >
            <p className="text-sm text-gray-600">
              {isDecline
                ? `This action will decline the creation of Task #${referenceNo}. Are you sure you want to proceed?`
                : `This action will approve the creation of Task #${referenceNo}. Are you sure you want to proceed?`}
            </p>

            {isDecline && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for decline
                </label>
                <Textarea
                  value={reasonText}
                  onChange={(e) => onReasonChange(e.target.value)}
                  placeholder="Enter your reason for declining this task"
                  className="w-full"
                  rows={4}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className={
                  isDecline
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }
                onClick={onConfirm}
              >
                {isDecline ? "Decline Task" : "Approve Task"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
