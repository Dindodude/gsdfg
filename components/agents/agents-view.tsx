"use client";

import { Bot, CheckCircle2, Clock3, FileJson, Play, ShieldAlert, Sparkles, TimerReset, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { agentPrompts } from "@/lib/agents/prompts";
import type { AgentDefinition, AgentRun } from "@/lib/types";
import { cn, formatDate, riskTone } from "@/lib/utils";

const statusTone = {
  Idle: "border-zinc-400/20 bg-zinc-400/10 text-zinc-300",
  Running: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  Complete: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  "Needs Review": "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  Blocked: "border-rose-400/40 bg-rose-500/15 text-rose-100",
};

export function AgentsView({
  agentDefinitions,
  agentRuns,
  source,
}: {
  agentDefinitions: AgentDefinition[];
  agentRuns: AgentRun[];
  source: "supabase" | "mock";
}) {
  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-4xl">
              <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
                <Sparkles className="h-3.5 w-3.5" />
                {source === "supabase" ? "Live agent registry" : "11-agent operating system"}
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-normal text-zinc-50">Specialized agents handle lead acquisition through delivery.</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Every agent returns structured JSON. The Security & Compliance Agent is mandatory before outreach and before website delivery.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => toast.info("Prompt registry opened")}>
                <FileJson className="h-4 w-4" />
                Prompt Registry
              </Button>
              <Button onClick={() => toast.info("Run agents from a lead record", { description: "Use Leads to find businesses, score them, generate outreach, and hand off website work." })}>
                <Play className="h-4 w-4" />
                Run Agents
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agentDefinitions.map((agent) => {
          const prompt = agentPrompts[agent.key];
          const isCompliance = agent.key === "security-compliance";
          return (
            <Card key={agent.key} className={cn("transition hover:border-white/18 hover:bg-white/[0.065]", isCompliance && "border-rose-300/30 bg-rose-500/[0.055]")}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border bg-white/7", isCompliance ? "border-rose-300/30 text-rose-100" : "border-white/10 text-emerald-200")}>
                      {isCompliance ? <ShieldAlert className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate">{agent.name}</CardTitle>
                      <CardDescription className="mt-1">{agent.model}</CardDescription>
                    </div>
                  </div>
                  <Badge className={statusTone[agent.status]}>{agent.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="min-h-20 text-sm leading-6 text-zinc-400">{agent.purpose}</p>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Success" value={`${agent.successRate}%`} />
                  <Stat label="Avg run" value={agent.avgDuration} />
                  <Stat label="Output" value={agent.outputLabel} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>Reliability</span>
                    <span>{agent.successRate}%</span>
                  </div>
                  <Progress value={agent.successRate} />
                </div>
                <div className="rounded-[8px] border border-white/10 bg-black/20 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <FileJson className="h-3.5 w-3.5 text-emerald-200" />
                    Structured output
                  </div>
                  <pre className="max-h-28 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-zinc-500">
                    {JSON.stringify(prompt.outputSchema, null, 2)}
                  </pre>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-500">Last run {formatDate(agent.lastRun)}</p>
                  <Button size="sm" variant={isCompliance ? "danger" : "secondary"} onClick={() => toast.info(`${agent.name} runs from the relevant workflow page`)}>
                    <Zap className="h-3.5 w-3.5" />
                    Run
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Agent Runs</CardTitle>
            <CardDescription>Audit-friendly record of agent input, status, cost, and risk output.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentRuns.map((run) => (
              <div key={run.id} className="rounded-[8px] border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {run.status === "running" ? <Clock3 className="h-4 w-4 text-amber-200" /> : <CheckCircle2 className="h-4 w-4 text-emerald-200" />}
                      <p className="truncate text-sm font-medium text-zinc-100">{run.agentName}</p>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{run.leadName ?? "System batch"}</p>
                  </div>
                  <div className="flex gap-2">
                    {run.riskLevel ? <Badge className={riskTone(run.riskLevel)}>{run.riskLevel}</Badge> : null}
                    <Badge className={cn("border-white/10 bg-white/6 text-zinc-300", run.status === "blocked" && "border-rose-400/40 bg-rose-500/15 text-rose-100")}>
                      {run.status}
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{run.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span>Started {formatDate(run.startedAt)}</span>
                  <span>Cost ${run.costEstimate.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Runtime Contract</CardTitle>
            <CardDescription>Production-ready behavior expected from every agent route.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Server-side OpenAI calls only",
              "JSON-mode style output",
              "Retry handling",
              "Token usage placeholder",
              "Cost logging placeholder",
              "OpenAI API key required",
              "Audit logs for every run",
              "Compliance gate before send and delivery",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/5 px-3 py-3">
                <TimerReset className="h-4 w-4 text-emerald-200" />
                <span className="text-sm text-zinc-300">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/5 p-2">
      <p className="truncate text-sm font-semibold text-zinc-100">{value}</p>
      <p className="mt-1 truncate text-[11px] text-zinc-500">{label}</p>
    </div>
  );
}
