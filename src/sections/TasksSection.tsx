"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Lock } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { usePartnerAccess } from "../hooks/usePartnerAccess";
import { useUserHierarchy } from "../hooks/useUserHierarchy";
import { useUserCampaigns } from "../hooks/useUserCampaigns";
import {
  DASHBOARD_SECTION_CONFIG,
  getResponsivePadding,
  getSectionContainerStyle,
} from "./SettingsSection";
import { useDeviceSize } from "../hooks/useDeviceSize";
import ConfirmActionModal from "./components/confirm-action-modal";
import TaskDetailsModal from "./components/task-details-modal";
import { TasksTable } from "./components/tasks-table";
import { toast } from "sonner";

// PHASE 4: Supabase integration for tasks
import { TaskService } from "../infrastructure/task/task.service";
import { CampaignService } from "../infrastructure/campaign/campaign.service";

interface Task {
  id: string;
  campaignId: string;
  dateCreated: string;
  referenceNo: string;
  taskName: string;
  status?: "pending" | "approved" | "declined";
}

interface TaskDetails extends Task {
  campaignName?: string;
  description?: string;
  program?: string;
  channel?: string;
  subChannel?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  createdBy?: string;
  approver?: string;
  dateCompleted?: string;
  qrCode?: string;
  promoCode?: string;
}

export default function TasksSection() {
  const { user } = useAuth();
  const { isMobile, isTablet, isDesktop, width, height } = useDeviceSize();
  const padding = getResponsivePadding(isMobile, isTablet);
  const { canRead, canWrite } = usePermissions();
  const { canAccessSection, partnerType } = usePartnerAccess();
  const { userIds } = useUserHierarchy();
  const { campaigns: userCampaigns, loading: campaignsLoading } =
    useUserCampaigns();

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
  const [taskStatus, setTaskStatus] = useState<
    "pending" | "approved" | "declined"
  >("pending");
  const [reasonText, setReasonText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // PHASE 4: Load tasks from Supabase and subscribe to real-time changes
  useEffect(() => {
    if (!userCampaigns || userCampaigns.length === 0) {
      setTasksLoading(false);
      return;
    }

    const loadTasks = async () => {
      try {
        setTasksLoading(true);
        // Load tasks for all user's campaigns
        const allTasks: any[] = [];
        for (const campaign of userCampaigns) {
          const campaignTasks = await TaskService.fetchTasks(campaign.id);
          allTasks.push(...campaignTasks);
        }

        const mapped = (allTasks || []).map((t) => ({
          ...t,
          id: t.id,
          campaignId: t.campaign_id,
          dateCreated: t.created_at,
          referenceNo: t.reference_no,
          taskName: t.task_name,
          status: t.status as "pending" | "approved" | "declined",
        }));

        setTasks(mapped);
      } catch (err) {
        console.error("Error loading tasks:", err);
        toast.error("Failed to load tasks");
      } finally {
        setTasksLoading(false);
      }
    };

    loadTasks();

    // PHASE 4: Subscribe to task changes for each campaign
    const unsubscribers: Array<() => void> = [];
    for (const campaign of userCampaigns) {
      const unsubscribe = TaskService.subscribeToTaskChanges(
        campaign.id,
        (updatedTask) => {
          setTasks((prev) => {
            const existing = prev.findIndex((t) => t.id === updatedTask.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = {
                ...updatedTask,
                campaignId: updatedTask.campaign_id,
                dateCreated: updatedTask.created_at,
                referenceNo: updatedTask.reference_no,
                taskName: updatedTask.task_name,
                status: updatedTask.status,
              };
              return updated;
            }
            return [
              ...prev,
              {
                ...updatedTask,
                campaignId: updatedTask.campaign_id,
                dateCreated: updatedTask.created_at,
                referenceNo: updatedTask.reference_no,
                taskName: updatedTask.task_name,
                status: updatedTask.status,
              },
            ];
          });
        },
      );
      unsubscribers.push(unsubscribe);
    }

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [userCampaigns]);

  // Calculate responsive dimensions
  // (Removed - using standard max-w-7xl layout instead)

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

  const handleViewTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const campaign = campaignsData.campaigns.find(
      (c) => c.id === task.campaignId,
    );
    if (campaign) {
      const details: TaskDetails = {
        id: task.id,
        campaignId: task.campaignId,
        dateCreated: task.dateCreated,
        referenceNo: task.referenceNo,
        taskName: task.taskName,
        status: task.status as any,
        campaignName: campaign.name,
        description: campaign.name || "",
        program: campaign.program_id,
        channel: "Marketing",
        subChannel: "Digital",
        startDate: new Date(campaign.duration_start).toLocaleString(),
        endDate: new Date(campaign.duration_end).toLocaleString(),
        duration: campaign.promo_code || "N/A",
        createdBy: "System",
        approver: user?.email || "Admin",
        promoCode: campaign.promo_code,
      };
      setSelectedTask(details);
    } else {
      setSelectedTask(task as any);
    }
    setTaskStatus((task.status as any) || "pending");
    setIsDetailsOpen(true);
  };

  const handleApproveClick = () => {
    setConfirmAction("approve");
    setIsConfirmOpen(true);
  };

  const handleDeclineClick = () => {
    setConfirmAction("decline");
    setReasonText("");
    setIsConfirmOpen(true);
  };

  // PHASE 4: Handle task approval/rejection via RPC
  const handleConfirmAction = async () => {
    if (!selectedTask || !user) return;

    try {
      const userId = user.id || (user as any)._id;

      if (confirmAction === "approve") {
        const result = await TaskService.approveTask({
          taskId: selectedTask.id,
          approverUserId: userId,
          notes: reasonText,
        });

        if (result.success) {
          toast.success("Task approved successfully");
          setTaskStatus("approved");
          // Remove from pending, add to complete
          setTasks((prev) =>
            prev.map((t) =>
              t.id === selectedTask.id ? { ...t, status: "approved" } : t,
            ),
          );
        } else {
          toast.error(result.error || "Failed to approve task");
        }
      } else {
        const result = await TaskService.rejectTask({
          taskId: selectedTask.id,
          approverUserId: userId,
          reason: reasonText,
        });

        if (result.success) {
          toast.success("Task rejected successfully");
          setTaskStatus("declined");
          setTasks((prev) =>
            prev.map((t) =>
              t.id === selectedTask.id ? { ...t, status: "declined" } : t,
            ),
          );
        } else {
          toast.error(result.error || "Failed to reject task");
        }
      }
    } catch (err) {
      console.error("Error processing task action:", err);
      toast.error("An error occurred while processing your request");
    }

    setIsConfirmOpen(false);
  };

  const displayTasks = tasks.filter((task) => {
    if (activeTab === "pending") {
      return task.status === "pending";
    }
    return task.status === "approved" || task.status === "declined";
  });

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

        {/* Tasks Table Component */}
        <div>
          <TasksTable
            tasks={displayTasks}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onViewTask={handleViewTask}
            mode={activeTab}
          />
        </div>
      </div>

      {/* Task Details Modal Component */}
      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        task={selectedTask}
        taskStatus={taskStatus}
        canManageTasks={canManageTasks}
        onApproveClick={handleApproveClick}
        onDeclineClick={handleDeclineClick}
      />

      {/* Confirm Action Modal Component */}
      <ConfirmActionModal
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        action={confirmAction}
        referenceNo={selectedTask?.referenceNo}
        reasonText={reasonText}
        onReasonChange={setReasonText}
        onConfirm={handleConfirmAction}
        onModalOpen={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}
