import {
  Activity,
  Bot,
  CheckCircle2,
  Columns3,
  Gauge,
  LayoutDashboard,
  Mail,
  Settings,
  Sparkles,
  SquareKanban,
  UsersRound,
} from "lucide-react";

export const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: UsersRound },
  { href: "/pipeline", label: "Pipeline", icon: SquareKanban },
  { href: "/agents", label: "AI Agents", icon: Bot },
  { href: "/outreach", label: "Outreach", icon: Mail },
  { href: "/websites", label: "Websites", icon: Columns3 },
  { href: "/compliance", label: "Compliance", icon: CheckCircle2 },
  { href: "/tasks", label: "Tasks", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const quickCommands = [
  { label: "Run all agents", icon: Sparkles, action: "run-agents" },
  { label: "Open owner queue", icon: Gauge, href: "/tasks" },
  { label: "Review compliance warnings", icon: CheckCircle2, href: "/compliance" },
];
