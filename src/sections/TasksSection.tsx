"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Lock } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { usePartnerAccess } from "../hooks/usePartnerAccess";
import { useDeviceSize } from "../hooks/useDeviceSize";
import {
  getResponsivePadding,
  getSectionContainerStyle,
} from "./SettingsSection";
import { TasksTable } from "./components/tasks-table";
import TaskDetailsModal from "./components/task-details-modal";
import ConfirmActionModal from "./components/confirm-action-modal";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { Task, TaskStatus, TaskDetails } from "../types/auth.types";
import type { Database } from "../types/database.types";

export default function TasksSection() {
  const { user } = useAuth();
  const { isMobile, isTablet } = useDeviceSize();
  const padding = getResponsivePadding(isMobile, isTablet);
  const { canRead, canWrite } = usePermissions();
  const { canAccessSection, partnerType } = usePartnerAccess();

  // Permission checks
  const canViewTasks = canRead("tasks");
  const canManageTasks = canWrite("tasks");

  // State management
  const [activeTab, setActiveTab] = useState<"pending" | "complete">("pending");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "decline">(
    "approve",
  );
  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("pending");
  const [reasonText, setReasonText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Fetch tasks from Supabase for the partner
  useEffect(() => {
    if (!user || !canViewTasks) {
      setTasksLoading(false);
      return;
    }

    const loadTasks = async () => {
      try {
        setTasksLoading(true);
        // Fetch partner info from auth hook context (should be available in parent)
        // For now, fetch tasks for all campaigns belonging to this partner
        const { data: tasksData, error } = await supabase
          .from("tasks")
          .select(
            `
            *,
            campaigns(name, description, start_date, end_date, duration_start, duration_end, promo_code, program_id)
          `,
          )
          .order("date_created", { ascending: false });

        if (error) {
          console.error("Error fetching tasks:", error);
          toast.error("Failed to load tasks");
          return;
        }

        const mappedTasks: Task[] = (tasksData || []).map((t: any) => ({
          id: t.id,
          campaign_id: t.campaign_id,
          created_by_user_id: t.created_by_user_id,
          approver_id: t.approver_id,
          task_name: t.task_name,
          status: t.status as TaskStatus,
          reference_no: t.reference_no,
          description: t.description,
          channel: t.channel,
          sub_channel: t.sub_channel,
          date_created: t.date_created,
          completed_at: t.completed_at,
          created_at: t.created_at,
          updated_at: t.updated_at,
          partner_id: t.partner_id,
        }));

        setTasks(mappedTasks);
      } catch (err) {
        console.error("Error loading tasks:", err);
        toast.error("Failed to load tasks");
      } finally {
        setTasksLoading(false);
      }
    };

    loadTasks();

    // Subscribe to real-time task changes
    const subscription = supabase
      .channel("tasks_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => [payload.new as Task, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Task).id ? (payload.new as Task) : t,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, canViewTasks]);

  // Permission guard
  if (!canAccessSection("tasks") && partnerType) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">
            Access Restricted
          </h3>
          <p className="text-gray-500 mt-2">
            Your partner tier doesn't include task management access.
          </p>
        </div>
      </div>
    );
  }

  if (!canViewTasks) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Tasks Access Restricted
                </h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>You don't have permission to view tasks.</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to request{" "}
                <span className="font-medium text-foreground">tasks.read</span>{" "}
                permission.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle view task
  const handleViewTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const details: TaskDetails = {
      ...task,
      campaignName: task.task_name,
      campaign_description: task.description || undefined,
    };

    setSelectedTask(details);
    setTaskStatus(task.status);
    setIsDetailsOpen(true);
  };

  // Handle approve/decline actions
  const handleApproveClick = () => {
    setConfirmAction("approve");
    setIsConfirmOpen(true);
  };

  const handleDeclineClick = () => {
    setConfirmAction("decline");
    setReasonText("");
    setIsConfirmOpen(true);
  };

  // Handle confirm action (approve/decline)
  const handleConfirmAction = async () => {
    if (!selectedTask || !user) return;

    try {
      const userId = user.id || (user as any)._id;
      const newStatus: TaskStatus =
        confirmAction === "approve" ? "approved" : "declined";

      // Update task in Supabase
      const updateData = {
        status: newStatus,
        approver_id: userId,
        completed_at:
          newStatus === "approved" || newStatus === "declined"
            ? new Date().toISOString()
            : null,
      };

      const { error } = await (supabase as any)
        .from("tasks")
        .update(updateData)
        .eq("id", selectedTask.id);

      if (error) {
        toast.error(`Failed to ${confirmAction} task`);
        return;
      }

      toast.success(`Task ${confirmAction}ed successfully`);
      setTaskStatus(newStatus);

      // Update local state
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id ? { ...t, status: newStatus } : t,
        ),
      );
    } catch (err) {
      console.error("Error processing task action:", err);
      toast.error("An error occurred while processing your request");
    }

    setIsConfirmOpen(false);
    setIsDetailsOpen(false);
  };

  // Filter tasks by tab
  const displayTasks = tasks.filter((task) => {
    if (activeTab === "pending") {
      return task.status === "pending";
    }
    return task.status === "approved" || task.status === "declined";
  });

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={getSectionContainerStyle(padding)}>
      <div
        className="mx-auto space-y-6"
        style={{
          width: "max(88.33vw, 1272px)",
          maxWidth: "100%",
        }}
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-border pb-3">
          <button
            onClick={() => {
              setActiveTab("pending");
              setCurrentPage(1);
            }}
            className={`text-sm font-medium transition-colors ${
              activeTab === "pending"
                ? "text-primary border-b-2 border-primary -mb-3 pb-3"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Approval (
            {displayTasks.filter((t) => t.status === "pending").length})
          </button>
          <button
            onClick={() => {
              setActiveTab("complete");
              setCurrentPage(1);
            }}
            className={`text-sm font-medium transition-colors ${
              activeTab === "complete"
                ? "text-primary border-b-2 border-primary -mb-3 pb-3"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Complete (
            {displayTasks.filter((t) => t.status !== "pending").length})
          </button>
        </div>

        {/* Tasks Table */}
        {displayTasks.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                No {activeTab === "pending" ? "pending" : "completed"} tasks
                found.
              </p>
            </CardContent>
          </Card>
        ) : (
          <TasksTable
            tasks={displayTasks}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onViewTask={handleViewTask}
            mode={activeTab}
          />
        )}
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        task={selectedTask}
        taskStatus={taskStatus}
        canManageTasks={canManageTasks}
        onApproveClick={handleApproveClick}
        onDeclineClick={handleDeclineClick}
      />

      {/* Confirm Action Modal */}
      <ConfirmActionModal
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        action={confirmAction}
        referenceNo={selectedTask?.reference_no || undefined}
        reasonText={reasonText}
        onReasonChange={setReasonText}
        onConfirm={handleConfirmAction}
        onModalOpen={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}
