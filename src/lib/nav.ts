import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  HelpCircle,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Stethoscope,
  Users,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  to:
    | "/"
    | "/appointments"
    | "/patients"
    | "/doctors"
    | "/services"
    | "/availability"
    | "/conversations"
    | "/analytics"
    | "/settings"
    | "/help";
  icon: LucideIcon;
}

export const mainNav: NavItem[] = [
  { title: "Overview", to: "/", icon: LayoutDashboard },
  { title: "Appointments", to: "/appointments", icon: CalendarDays },
  { title: "Patients", to: "/patients", icon: Users },
  { title: "Doctors", to: "/doctors", icon: Stethoscope },
  { title: "Services", to: "/services", icon: ClipboardList },
  { title: "Availability", to: "/availability", icon: CalendarClock },
  { title: "Conversations", to: "/conversations", icon: MessagesSquare },
  { title: "Analytics", to: "/analytics", icon: BarChart3 },
];

export const bottomNav: NavItem[] = [
  { title: "Settings", to: "/settings", icon: Settings },
  { title: "Help & Support", to: "/help", icon: HelpCircle },
];

export const allNav = [...mainNav, ...bottomNav];
