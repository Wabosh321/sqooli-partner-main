"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from "../../types/auth.types";

interface TasksTableProps {
  tasks: Task[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onViewTask: (taskId: string) => void;
  mode: "pending" | "complete";
}

const getStatusStyles = (status?: string) =>
  status === "approved"
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
    : status === "declined"
      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

const getStatusLabel = (status?: string) =>
  !status || status === "pending"
    ? "Pending"
    : status[0].toUpperCase() + status.slice(1);

// Helper to format date
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

export function TasksTable({
  tasks,
  currentPage,
  onPageChange,
  onViewTask,
  mode,
}: TasksTableProps) {
  const itemsPerPage = mode === "pending" ? 5 : 8;
  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  const paginatedTasks = tasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="space-y-px">
          {paginatedTasks.map((task, index) => (
            <div
              key={task.id}
              className={`px-6 py-6 border-b border-slate-200 ${index === 0 ? "border-t" : ""} hover:bg-slate-50 transition-colors`}
            >
              <div
                className="grid gap-6"
                style={{
                  gridTemplateColumns:
                    mode === "complete"
                      ? "1fr 1fr 2fr 1fr 1fr auto"
                      : "1fr 1fr 2fr auto",
                }}
              >
                <div>
                  <p className="text-xs text-slate-600 mb-1">Date Created</p>
                  <p className="text-sm text-slate-900 font-medium">
                    {formatDate(task.date_created)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-600 mb-1">Reference No</p>
                  <p className="text-sm text-slate-900 font-medium">
                    {task.reference_no || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-600 mb-1">Task Name</p>
                  <p className="text-sm text-slate-900 font-medium">
                    {task.task_name}
                  </p>
                </div>

                {mode === "complete" && (
                  <>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(
                          task.status,
                        )}`}
                      >
                        {getStatusLabel(task.status)}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        Date Completed
                      </p>
                      <p className="text-sm text-slate-900 font-medium">
                        {formatDate(task.completed_at)}
                      </p>
                    </div>
                  </>
                )}

                <div className="flex items-end justify-end">
                  <button
                    onClick={() => onViewTask(task.id)}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Eye className="w-5 h-5 text-blue-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 flex items-center justify-between bg-white border-t border-slate-200">
        <span className="text-sm text-slate-600">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
