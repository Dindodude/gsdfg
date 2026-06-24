import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ComplianceStatus, LeadStatus, RiskLevel, TaskPriority } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreTone(score: number) {
  if (score >= 82) return "text-emerald-200 border-emerald-400/30 bg-emerald-400/10";
  if (score >= 62) return "text-amber-200 border-amber-400/30 bg-amber-400/10";
  return "text-rose-200 border-rose-400/30 bg-rose-400/10";
}

export function riskTone(risk: RiskLevel) {
  const tones: Record<RiskLevel, string> = {
    Low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    Medium: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    High: "border-rose-400/40 bg-rose-500/15 text-rose-100",
  };
  return tones[risk];
}

export function complianceTone(status: ComplianceStatus) {
  const tones: Record<ComplianceStatus, string> = {
    Approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    Pending: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    "Needs Fixes": "border-amber-400/30 bg-amber-400/10 text-amber-200",
    Blocked: "border-rose-400/40 bg-rose-500/15 text-rose-100",
  };
  return tones[status];
}

export function priorityTone(priority: TaskPriority) {
  const tones: Record<TaskPriority, string> = {
    Low: "border-zinc-400/20 bg-zinc-400/10 text-zinc-200",
    Medium: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    High: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    Critical: "border-rose-400/40 bg-rose-500/15 text-rose-100",
  };
  return tones[priority];
}

export function statusTone(status: LeadStatus) {
  if (["Interested", "Owner Talking", "Client Preview Ready", "Closed Won"].includes(status)) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }
  if (["Compliance Review", "QA Review", "Revision Requested"].includes(status)) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  }
  if (["Closed Lost"].includes(status)) {
    return "border-rose-400/40 bg-rose-500/15 text-rose-100";
  }
  return "border-white/15 bg-white/8 text-zinc-200";
}
