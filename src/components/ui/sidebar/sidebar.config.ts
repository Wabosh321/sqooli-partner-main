// Data-only configuration for sidebar menu
import {
  Home,
  Megaphone,
  Wallet,
  Users,
  Settings,
  LayoutGrid,
  CheckSquare,
  IdCard,
  HandHeart,
} from "lucide-react";

export interface SidebarNavItem {
  id: string;
  label: string;
  icon?: any;
  requiredCategory?: string;
  requiredPermission?: string;
  excludeForRoles?: string[];
}

export const SIDEBAR_MENU: SidebarNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    requiredCategory: "dashboard",
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
    requiredCategory: "campaigns",
  },
  {
    id: "beneficiaries",
    label: "Beneficiaries",
    icon: IdCard,
    requiredCategory: "beneficiaries",
  },
  {
    id: "sponsorships",
    label: "Sponsorships",
    icon: HandHeart,
    requiredCategory: "sponsorships",
  },
  {
    id: "programs",
    label: "Programs",
    icon: LayoutGrid,
    requiredCategory: "programs",
  },
  { id: "wallet", label: "Wallet", icon: Wallet, requiredCategory: "wallet" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, requiredCategory: "tasks" },
  { id: "users", label: "Users", icon: Users, requiredCategory: "users" },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    requiredCategory: "settings",
  },
];

export default SIDEBAR_MENU;
