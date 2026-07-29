import type { IconData } from "@benrobo/iconary/core";
import {
  DashboardSquare01Icon,
  RecordIcon,
  Scissor01Icon,
  Settings01Icon,
  SlidersHorizontalIcon,
} from "@benrobo/iconary/core/duotone-rounded";

export type NavItem = {
  to: string;
  label: string;
  icon: IconData;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Projects", icon: DashboardSquare01Icon },
  { to: "/setup", label: "Setup", icon: SlidersHorizontalIcon },
  { to: "/record", label: "Record", icon: RecordIcon },
  { to: "/edit", label: "Editor", icon: Scissor01Icon },
  { to: "/preferences", label: "Preferences", icon: Settings01Icon },
];
