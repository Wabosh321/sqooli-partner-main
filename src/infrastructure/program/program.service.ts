/**
 * PHASE 4: Program Service Layer
 * Handles program operations via RPC functions and real-time subscriptions
 */

import { supabase } from "../../lib/supabase";

export interface CreateProgramInput {
  partnerId: string;
  createdByUserId: string;
  programName: string;
  description?: string;
  startDate: string;
  endDate: string;
  curriculumId?: string;
  enrollmentCount?: number;
  metadata?: Record<string, any>;
}

export interface UpdateProgramInput {
  programId: string;
  programName?: string;
  description?: string;
  status?:
    | "draft"
    | "active"
    | "pending"
    | "approved"
    | "declined"
    | "completed"
    | "expired";
  enrollmentCount?: number;
  metadata?: Record<string, any>;
}

export const ProgramService = {
  // ============================================================================
  // PHASE 4: RPC-based methods
  // ============================================================================

  /**
   * PHASE 4: Create program via RPC function
   * Executes atomic transaction with activity logging
   */
  async createProgram(input: CreateProgramInput): Promise<{
    success: boolean;
    programId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("rpc_create_program", {
        p_partner_id: input.partnerId,
        p_created_by_user_id: input.createdByUserId,
        p_program_name: input.programName,
        p_description: input.description,
        p_start_date: input.startDate,
        p_end_date: input.endDate,
        p_curriculum_id: input.curriculumId,
        p_enrollment_count: input.enrollmentCount,
        p_metadata: input.metadata,
      });

      if (error) {
        console.error("Error creating program:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        programId: data?.program_id,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error creating program:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /**
   * PHASE 4: Update program via RPC function
   * Logs changes to activity log
   */
  async updateProgram(input: UpdateProgramInput): Promise<{
    success: boolean;
    programId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("rpc_update_program", {
        p_program_id: input.programId,
        p_program_name: input.programName,
        p_description: input.description,
        p_status: input.status,
        p_enrollment_count: input.enrollmentCount,
        p_metadata: input.metadata,
      });

      if (error) {
        console.error("Error updating program:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        programId: data?.program_id,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error updating program:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /**
   * PHASE 4: Delete program via RPC function
   */
  async deleteProgram(programId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("rpc_delete_program", {
        p_program_id: programId,
      });

      if (error) {
        console.error("Error deleting program:", error);
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        error: data?.error,
      };
    } catch (err) {
      console.error("Unexpected error deleting program:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },

  /**
   * PHASE 4: Fetch all programs for partner
   */
  async fetchPrograms(partnerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching programs:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error("Unexpected error fetching programs:", err);
      return [];
    }
  },

  /**
   * PHASE 4: Fetch single program
   */
  async fetchProgram(programId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId)
        .single();

      if (error) {
        console.error("Error fetching program:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Unexpected error fetching program:", err);
      return null;
    }
  },

  /**
   * PHASE 4: Subscribe to real-time program changes
   * Triggers on INSERT, UPDATE, DELETE
   */
  subscribeToProgramChanges(
    partnerId: string,
    callback: (data: any) => void,
  ): () => void {
    const subscription = supabase
      .channel(`programs:partner_id=eq.${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "programs",
          filter: `partner_id=eq.${partnerId}`,
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
   * PHASE 4: Subscribe to program inserts (new programs)
   */
  subscribeToProgramInserts(
    partnerId: string,
    callback: (data: any) => void,
  ): () => void {
    const subscription = supabase
      .channel(`programs_insert:partner_id=eq.${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "programs",
          filter: `partner_id=eq.${partnerId}`,
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
};
