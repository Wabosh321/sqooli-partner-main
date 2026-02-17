export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string;
          convex_id: string | null;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_id: string;
          convex_id?: string | null;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string;
          convex_id?: string | null;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      partners: {
        Row: {
          id: string;
          convex_id: string | null;
          user_id: string;
          org_name: string;
          org_email: string | null;
          org_phone: string | null;
          description: string | null;
          logo_url: string | null;
          status: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          convex_id?: string | null;
          user_id: string;
          org_name: string;
          org_email?: string | null;
          org_phone?: string | null;
          description?: string | null;
          logo_url?: string | null;
          status?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          convex_id?: string | null;
          user_id?: string;
          org_name?: string;
          org_email?: string | null;
          org_phone?: string | null;
          description?: string | null;
          logo_url?: string | null;
          status?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          convex_id: string | null;
          partner_id: string;
          name: string;
          description: string | null;
          status: string | null;
          target_amount: number | null;
          current_amount: number | null;
          commission_rate: number | null;
          start_date: string | null;
          end_date: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          convex_id?: string | null;
          partner_id: string;
          name: string;
          description?: string | null;
          status?: string | null;
          target_amount?: number | null;
          current_amount?: number | null;
          commission_rate?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          convex_id?: string | null;
          partner_id?: string;
          name?: string;
          description?: string | null;
          status?: string | null;
          target_amount?: number | null;
          current_amount?: number | null;
          commission_rate?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          convex_id: string | null;
          campaign_id: string | null;
          user_id: string | null;
          partner_id: string | null;
          amount: number;
          currency: string | null;
          status: string | null;
          transaction_type: string | null;
          external_ref: string | null;
          payment_method: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          convex_id?: string | null;
          campaign_id?: string | null;
          user_id?: string | null;
          partner_id?: string | null;
          amount: number;
          currency?: string | null;
          status?: string | null;
          transaction_type?: string | null;
          external_ref?: string | null;
          payment_method?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          convex_id?: string | null;
          campaign_id?: string | null;
          user_id?: string | null;
          partner_id?: string | null;
          amount?: number;
          currency?: string | null;
          status?: string | null;
          transaction_type?: string | null;
          external_ref?: string | null;
          payment_method?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      wallets: {
        Row: {
          id: string;
          convex_id: string | null;
          partner_id: string;
          balance: number | null;
          total_earned: number | null;
          bank_name: string | null;
          account_number: string | null;
          account_holder: string | null;
          status: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          convex_id?: string | null;
          partner_id: string;
          balance?: number | null;
          total_earned?: number | null;
          bank_name?: string | null;
          account_number?: string | null;
          account_holder?: string | null;
          status?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          convex_id?: string | null;
          partner_id?: string;
          balance?: number | null;
          total_earned?: number | null;
          bank_name?: string | null;
          account_number?: string | null;
          account_holder?: string | null;
          status?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      withdrawals: {
        Row: {
          id: string;
          convex_id: string | null;
          partner_id: string;
          wallet_id: string;
          amount: number;
          status: string | null;
          reason: string | null;
          admin_notes: string | null;
          mpesa_receipt: string | null;
          requested_at: string;
          approved_at: string | null;
          completed_at: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          convex_id?: string | null;
          partner_id: string;
          wallet_id: string;
          amount: number;
          status?: string | null;
          reason?: string | null;
          admin_notes?: string | null;
          mpesa_receipt?: string | null;
          requested_at?: string;
          approved_at?: string | null;
          completed_at?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          convex_id?: string | null;
          partner_id?: string;
          wallet_id?: string;
          amount?: number;
          status?: string | null;
          reason?: string | null;
          admin_notes?: string | null;
          mpesa_receipt?: string | null;
          requested_at?: string;
          approved_at?: string | null;
          completed_at?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          convex_id: string | null;
          user_id: string;
          title: string;
          message: string;
          type: string | null;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          convex_id?: string | null;
          user_id: string;
          title: string;
          message: string;
          type?: string | null;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          convex_id?: string | null;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string | null;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          convex_id: string | null;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          convex_id?: string | null;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          convex_id?: string | null;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          convex_id: string | null;
          user_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          old_values: Record<string, any> | null;
          new_values: Record<string, any> | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          convex_id?: string | null;
          user_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_values?: Record<string, any> | null;
          new_values?: Record<string, any> | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          convex_id?: string | null;
          user_id?: string | null;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          old_values?: Record<string, any> | null;
          new_values?: Record<string, any> | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
