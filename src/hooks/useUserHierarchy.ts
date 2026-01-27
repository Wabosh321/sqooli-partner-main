import { useAuth } from "./useAuth";
import { useEffect, useState } from "react";
import usersData from "../auth/data/users.json";

interface UserHierarchyData {
  currentUser: any;
  isAdminPartner: boolean;
  isPartnerMember: boolean;
  parentUserId: string | null;
  childUsers: any[];
  userIds: string[]; // Current user ID + all child user IDs
}

export function useUserHierarchy(): UserHierarchyData {
  const { user } = useAuth();
  const [hierarchy, setHierarchy] = useState<UserHierarchyData>({
    currentUser: null,
    isAdminPartner: false,
    isPartnerMember: false,
    parentUserId: null,
    childUsers: [],
    userIds: [],
  });

  useEffect(() => {
    if (!user) return;

    const currentUser = usersData.users.find((u) => u.id === user.id);
    if (!currentUser) return;

    const isAdminPartner = currentUser.role === "admin_partner";
    const isPartnerMember = currentUser.role === "partner_member";
    const parentUserId = (currentUser as any).parent_user_id || null;

    // Get child users if current user is admin_partner
    const childUsers = isAdminPartner
      ? usersData.users.filter(
          (u) => (u as any).parent_user_id === currentUser.id,
        )
      : [];

    // Build user IDs array: current user + all children
    const userIds = [currentUser.id, ...childUsers.map((u) => u.id)];

    setHierarchy({
      currentUser,
      isAdminPartner,
      isPartnerMember,
      parentUserId,
      childUsers,
      userIds,
    });
  }, [user]);

  return hierarchy;
}
