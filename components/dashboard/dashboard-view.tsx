"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  DollarSign,
  MailCheck,
  MousePointer2,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { workflowStages } from "@/lib/mock-data";
import type { ActivityLog, AgentRun, ComplianceReview, Lead, OutreachMessage, Task, WebsiteProject } from "@/lib/types";
import { cn, complianceTone, formatCurrency, formatDate, riskTone, statusTone } from "@/lib/utils";

export function DashboardView({
  leads,
  websiteProjects,
  outreachMessages,
  agentRuns,
  complianceReviews,
  tasks,
  activityLogs,
  source,
}: {
  leads: Lead[];
  websiteProjects: WebsiteProject[];
  outreachMessages: OutreachMessage[];
  agentRuns: AgentRun[];
  complianceReviews: ComplianceReview[];
  tasks: Task[];
  activityLogs: ActivityLog[];
  source: "supabase" | "mock";
}) {
  const interestedLeads = leads.filter((lead) => ["Interested", "Owner Talking", "Send to Website Team"].includes(lead.status));
  const websitesInProgress = websiteProjects.filter((project) => ["Intake", "In Progress", "QA Review", "Compliance Review"].includes(project.status));
  const websitesCompleted = websiteProjects.filter((project) => ["Client Preview Ready", "Delivered"].includes(project.status));
  const outreachSent = outreachMessages.filter((message) => message.status === "Sent").length;
  const replyRate = Math.round((5 / Math.max(outreachSent, 1)) * 100);
  const revenueEstimate = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
  const funnelData = [
    { name: "Leads", value: leads.length },
    { name: "Scored", value: leads.filter((lead) => lead.leadScore > 0).length },
    { name: "Outreach", value: leads.filter((lead) => ["Outreach Ready", "Outreach Sent", "Replied", "Interested", "Owner Talking"].includes(lead.status)).length },
    { name: "Interested", value: interestedLeads.length },
    { name: "Websites", value: websiteProjects.length },
    { name: "Won", value: leads.filter((lead) => lead.status === "Closed Won").length },
  ];
  const revenueSeries = [
    { month: "Jan", value: 11800 },
    { month: "Feb", value: 16400 },
    { month: "Mar", value: 22100 },
    { month: "Apr", value: 29800 },
    { month: "May", value: 38200 },
    { month: "Jun", value: revenueEstimate },
  ];
  const metrics = [
    { label: "Total leads", value: leads.length.toString(), change: source === "supabase" ? "Live database" : "Connect Supabase", icon: UsersRound },
    { label: "Interested leads", value: interestedLeads.length.toString(), change: "Owner action needed", icon: MousePointer2 },
    { label: "Websites in progress", value: websitesInProgress.length.toString(), change: "AI team active", icon: Bot },
    { label: "Websites completed", value: websitesCompleted.length.toString(), change: "Ready for preview", icon: CheckCircle2 },
    { label: "Outreach sent", value: outreachSent.toString(), change: `${replyRate}% reply rate`, icon: MailCheck },
    { label: "Revenue estimate", value: formatCurrency(revenueEstimate), change: "Weighted pipeline", icon: DollarSign },
  ];
  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="glass-strong overflow-hidden">
          <CardContent className="p-6 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Autonomous pipeline online
                </Badge>
                <h2 className="mt-5 text-3xl font-semibold tracking-normal text-zinc-50 sm:text-4xl">
                  AI finds, qualifies, contacts, builds, checks, and packages the website delivery.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
                  The owner enters after intent is detected, adds conversation notes, then sends the lead into the website team workflow.
                </p>
              </div>
              <div className="grid min-w-[260px] gap-3 rounded-[8px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Today&apos;s automation coverage</span>
                  <span className="text-emerald-200">87%</span>
                </div>
                <Progress value={87} />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Runs" value="10" />
                  <MiniStat label="Blocked" value="1" tone="text-rose-200" />
                  <MiniStat label="Queued" value="3" tone="text-amber-200" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner Queue</CardTitle>
            <CardDescription>Manual steps only after interest or compliance warnings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="rounded-[8px] border border-white/10 bg-white/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">{task.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{task.description}</p>
                  </div>
                  <Badge className={cn("shrink-0", task.priority === "Critical" ? "border-rose-400/40 bg-rose-500/15 text-rose-100" : "border-amber-400/30 bg-amber-400/10 text-amber-100")}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="transition hover:border-white/18 hover:bg-white/[0.065]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-normal text-zinc-50">{metric.value}</p>
                  <p className="mt-2 text-sm text-zinc-400">{metric.change}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[8px] border border-white/10 bg-white/7 text-emerald-200">
                  <metric.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Estimated website package revenue from the active pipeline.</CardDescription>
            </div>
            <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
              <TrendingUp className="h-3.5 w-3.5" />
              +42%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    cursor={{ stroke: "rgba(110,231,183,0.35)" }}
                    contentStyle={{
                      background: "rgba(12,14,13,0.95)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#f4f4f5",
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6ee7b7" strokeWidth={2} fill="url(#revenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Lead flow from capture through closed won.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#d4d4d8", fontSize: 12 }} axisLine={false} tickLine={false} width={86} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "rgba(12,14,13,0.95)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#f4f4f5",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#f0c86a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Automation Workflow</CardTitle>
            <CardDescription>Kanban stages are condensed here and expanded on the Pipeline page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflowStages.map((stage, index) => {
              const stageLeads = leads.filter((lead) => stage.statuses.includes(lead.status));
              return (
                <div key={stage.name} className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/5 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white/8 text-sm text-zinc-300">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{stage.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {stage.statuses.slice(0, 3).map((status) => (
                        <Badge key={status} className={cn("text-[10px]", statusTone(status))}>
                          {status}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-zinc-50">{stageLeads.length}</p>
                    <p className="text-[11px] text-zinc-500">leads</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Recent Agent Activity</CardTitle>
              <CardDescription>Autonomous actions, blocks, QA events, and owner handoffs.</CardDescription>
            </div>
            <Button variant="secondary" size="sm">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex gap-3">
                <div
                  className={cn(
                    "mt-1 h-2.5 w-2.5 rounded-full",
                    log.severity === "critical" && "bg-rose-300 shadow-[0_0_18px_rgba(251,113,133,0.8)]",
                    log.severity === "warning" && "bg-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.8)]",
                    log.severity === "success" && "bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]",
                    log.severity === "info" && "bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.55)]",
                  )}
                />
                <div className="min-w-0 flex-1 border-b border-white/8 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm text-zinc-200">
                    <span className="font-medium text-zinc-50">{log.actor}</span> {log.action}{" "}
                    <span className="text-zinc-400">{log.target}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{formatDate(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Alerts</CardTitle>
            <CardDescription>High-risk items block sending or delivery until fixed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {complianceReviews.slice(0, 4).map((review) => (
              <div key={review.id} className="rounded-[8px] border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">{review.targetName}</p>
                    <p className="mt-1 text-xs text-zinc-500">{review.targetType}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={riskTone(review.riskLevel)}>{review.riskLevel}</Badge>
                    <Badge className={complianceTone(review.status === "Approved" ? "Approved" : review.status === "Blocked" ? "Blocked" : "Needs Fixes")}>
                      {review.status}
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-400">{review.agentNotes}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live System State</CardTitle>
            <CardDescription>Loading and execution states are visible instead of hidden behind empty screens.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {agentRuns.slice(0, 4).map((run) => (
              <div key={run.id} className="rounded-[8px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  {run.status === "running" ? <Clock className="h-3.5 w-3.5 text-amber-200" /> : <Bot className="h-3.5 w-3.5 text-emerald-200" />}
                  {run.agentName}
                </div>
                <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-200">{run.summary}</p>
                {run.status === "running" ? <Skeleton className="mt-4 h-2 w-full" /> : <Progress value={run.status === "blocked" ? 100 : 92} className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MiniStat({ label, value, tone = "text-zinc-100" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/5 px-2 py-3">
      <p className={cn("text-lg font-semibold", tone)}>{value}</p>
      <p className="mt-1 text-[11px] text-zinc-500">{label}</p>
    </div>
  );
}
