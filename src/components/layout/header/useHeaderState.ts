import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { AuthenticatedUser, Partner } from "../../../types/auth.types";
import {
  getDisplayName,
  getUserEmail,
  getUserInitials,
} from "../../../types/auth.types";
import { supabase } from "../../../lib/supabase";

export interface UseHeaderStateProps {
  user: AuthenticatedUser | null;
  loading: boolean;
  partner: Partner | null;
}

export function useHeaderState({
  user,
  loading,
  partner,
}: UseHeaderStateProps) {
  const navigate = useNavigate();

  const fullName = user ? getDisplayName(user) : "";
  const email = user ? getUserEmail(user) : "";
  const initials = user ? getUserInitials(user) : "";

  const userRole = partner?.role || null;
  const userExtension = partner?.extension || null;

  const onLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully 👋");
      navigate("/signIn");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An unexpected error occurred during logout.");
    }
  }, [navigate]);

  return {
    user,
    loading,
    partner,
    fullName,
    email,
    initials,
    userRole,
    userExtension,
    onLogout,
  };
}
