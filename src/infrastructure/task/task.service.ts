/**
 * PHASE 4: Task Service Layer
 * Handles task operations including approval workflows via RPC functions and real-time subscriptions
 */

import { supabase } from "../../lib/supabase";

export interface CreateTaskInput {
  campaignId: string;
  taskName: string;
  referenceNo: string;
  description?: string;
  assignedToUserId: string;
  approverUserId: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, any>;
}

export interface UpdateTaskInput {
  taskId: string;
  taskName?: string;
  description?: string;
  assignedToUserId?: string;
  approverUserId?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, any>;
}

export interface ApproveTaskInput {
  taskId: string;
  approverUserId: string;
  notes?: string;
}

export interface RejectTaskInput {
  taskId: string;
  approverUserId: string;
  reason: string;
}

export const TaskService = {
  // ============================================================================
  // PHASE 4: Task Management RPC Methods
  // ============================================================================

  /**
   * PHASE 4: Create task via RPC function
   * Executes atomic transaction with activity logging
   */
  async createTask(input: CreateTaskInput): Promise<{
    success: boolean;
    taskId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("rpc_create_task", {
        p_campaign_id: input.campaignId,
        p_task_name: input.taskName,
        p_reference_no: input.referenceNo,
        p_description: input.description,
        p_assigned_to_user_id: input.assignedToUserId,
        p_approver_user_id: input.approverUserId,
        p_due_date: input.dueDate,
        p_priority: input.priority || "medium",
        p_metadata: input.metadata,
      });

      if (error) {
        console.error("Error creating task:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        taskId: data?.task_id,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error creating task:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /**
   * PHASE 4: Update task via RPC function
   * Logs changes to activity log
   */
  async updateTask(input: UpdateTaskInput): Promise<{
    success: boolean;
    taskId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("rpc_update_task", {
        p_task_id: input.taskId,
        p_task_name: input.taskName,
        p_description: input.description,
        p_assigned_to_user_id: input.assignedToUserId,
        p_approver_user_id: input.approverUserId,
        p_due_date: input.dueDate,
        p_priority: input.priority,
        p_metadata: input.metadata,
      });

      if (error) {
        console.error("Error updating task:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        taskId: data?.task_id,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error updating task:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /**
   * PHASE 4: Delete task via RPC function
   */
  async deleteTask(taskId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("rpc_delete_task", {
        p_task_id: taskId,
      });

      if (error) {
        console.error("Error deleting task:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error deleting task:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  // ============================================================================
  // PHASE 4: Task Approval Workflow Methods
  // ============================================================================

  /**
   * PHASE 4: Approve task via RPC function
   * Updates status to 'approved' and sets approver_user_id
   */
  async approveTask(input: ApproveTaskInput): Promise<{
    success: boolean;
    taskId?: string;
    status?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("rpc_approve_task", {
        p_task_id: input.taskId,
        p_approver_user_id: input.approverUserId,
        p_notes: input.notes,
      });

      if (error) {
        console.error("Error approving task:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        taskId: data?.task_id,
        status: data?.status,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error approving task:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /**
   * PHASE 4: Reject task via RPC function
   * Updates status to 'declined' and logs rejection reason
   */
  async rejectTask(input: RejectTaskInput): Promise<{
    success: boolean;
    taskId?: string;
    status?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("rpc_reject_task", {
        p_task_id: input.taskId,
        p_approver_user_id: input.approverUserId,
        p_reason: input.reason,
      });

      if (error) {
        console.error("Error rejecting task:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        taskId: data?.task_id,
        status: data?.status,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error rejecting task:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  // ============================================================================
  // PHASE 4: Task Query Methods
  // ============================================================================

  /**
   * PHASE 4: Fetch all tasks for campaign
   */
  async fetchTasks(campaignId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error("Unexpected error fetching tasks:", err);
      return [];
    }
  },

  /**
   * PHASE 4: Fetch tasks for user (assigned or as approver)
   */
  async fetchUserTasks(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .or(`assigned_to_user_id.eq.${userId},approver_user_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user tasks:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error("Unexpected error fetching user tasks:", err);
      return [];
    }
  },

  /**
   * PHASE 4: Fetch single task
   */
  async fetchTask(taskId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (error) {
        console.error("Error fetching task:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Unexpected error fetching task:", err);
      return null;
    }
  },

  // ============================================================================
  // PHASE 4: Real-time Subscription Methods
  // ============================================================================

  /**
   * PHASE 4: Subscribe to real-time task changes
   * Triggers on INSERT, UPDATE, DELETE
   */
  subscribeToTaskChanges(
    campaignId: string,
    callback: (data: any) => void,
  ): () => void {
    const subscription = supabase
      .channel(`tasks:campaign_id=eq.${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          callback(payload.new || payload.old);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  /**
   * PHASE 4: Subscribe to task approvals (status changes to approved/declined)
   */
  subscribeToTaskApprovals(
    userId: string,
    callback: (data: any) => void,
  ): () => void {
    const subscription = supabase
      .channel(`task_approvals:approver_user_id=eq.${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `approver_user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  /**
   * PHASE 4: Subscribe to tasks assigned to user
   */
  subscribeToAssignedTasks(
    userId: string,
    callback: (data: any) => void,
  ): () => void {
    const subscription = supabase
      .channel(`assigned_tasks:assigned_to_user_id=eq.${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `assigned_to_user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new || payload.old);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },
};
