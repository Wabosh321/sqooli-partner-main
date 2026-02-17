"use client";

import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "../../components/ui/dialog";
import { TaskDetails, TaskStatus } from "../../types/auth.types";

interface TaskDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskDetails | null;
  taskStatus: TaskStatus;
  canManageTasks: boolean;
  onApproveClick: () => void;
  onDeclineClick: () => void;
}

export default function TaskDetailsModal({
  isOpen,
  onOpenChange,
  task,
  taskStatus,
  canManageTasks,
  onApproveClick,
  onDeclineClick,
}: TaskDetailsModalProps) {
  if (!task) return null;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "declined":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending Approval";
      case "approved":
        return "Approved";
      case "declined":
        return "Declined";
      default:
        return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Backdrop overlay - only renders when modal is open */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
      )}

      {/* Modal container - above header and all components */}
      <DialogContent
        className="fixed z-[60] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-0 shadow-xl p-0 max-w-none max-h-none w-[95%] h-[95%]"
        style={{ maxWidth: "1376px", maxHeight: "950px" }}
      >
        <div className="w-full h-full rounded-2xl bg-white flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex flex-row items-start justify-between border-b border-gray-200 px-8 py-6 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tasks</span>
              <span className="text-gray-400">/</span>
              <span className="text-sm text-blue-600">Campaign Approval</span>
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            <div className="flex gap-6 h-full">
              {/* Left Side - Task Info Section */}
              <div className="w-72 flex-shrink-0 border border-gray-200 rounded-lg p-4 bg-white overflow-hidden">
                <div className="flex flex-col gap-4 h-full overflow-y-auto">
                  {/* Placeholder Image */}
                  <div className="bg-yellow-300 w-full h-24 rounded-lg flex-shrink-0"></div>

                  {/* Task Name */}
                  <h2 className="text-lg font-bold text-gray-900">
                    {task.task_name}
                  </h2>

                  {/* Info Fields */}
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600">Date Created:</p>
                      <p className="text-gray-900">{task.date_created}</p>
                    </div>
                    {taskStatus !== "pending" && (
                      <div>
                        <p className="text-gray-600">Date Completed:</p>
                        <p className="text-gray-900">
                          {task.completed_at || task.date_created}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">Approver:</p>
                      <p className="text-gray-900">{task.approver}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Task Details Section */}
              <div className="flex-1 flex flex-col gap-6">
                {/* Header Row */}
                <div className="flex items-center justify-between flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Task Details
                  </h3>
                  {taskStatus === "pending" && canManageTasks && (
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={onDeclineClick}
                      >
                        Decline
                      </Button>
                      <Button
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={onApproveClick}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </div>

                {/* Details Body Container */}
                <div className="flex gap-0 flex-1 min-h-0">
                  {/* Content Subsection */}
                  <div className="flex-1 border-r border-gray-200 pr-6 overflow-y-auto">
                    <div>
                      <h4 className="text-gray-600 mb-2">Campaign Name</h4>
                      <p className="text-gray-900 font-medium">
                        {task.campaignName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {task.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Date Created:
                        </p>
                        <p className="text-sm text-gray-900">
                          {task.date_created}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Program:</p>
                        <p className="text-sm text-gray-900">{task.program}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Channel:</p>
                        <p className="text-sm text-gray-900">{task.channel}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Sub-Channel:
                        </p>
                        <p className="text-sm text-gray-900">
                          {task.sub_channel}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Start Date:
                        </p>
                        <p className="text-sm text-gray-900">
                          {task.start_date}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">End Date:</p>
                        <p className="text-sm text-gray-900">{task.end_date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Duration:</p>
                        <p className="text-sm text-gray-900">{task.duration}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Created By:
                        </p>
                        <p className="text-sm text-gray-900">
                          {task.created_by}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Status:</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(taskStatus)}`}
                        >
                          {getStatusLabel(taskStatus)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Subsection */}
                  <div className="w-72 flex-shrink-0 border-l border-gray-200 pl-6 flex flex-col items-center justify-start pt-4">
                    <p className="text-sm text-gray-600">QR Code</p>
                    <div className="bg-black/10 w-32 h-32 rounded mt-4"></div>
                    <p className="text-xs text-gray-600 mt-4">
                      Promocode: {task.promo_code}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
