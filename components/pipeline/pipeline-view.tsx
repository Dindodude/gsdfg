"use client";

import { ArrowRight, Bot, CheckCircle2, CircleDashed, Lock, MessageSquareText, Send, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { workflowStages } from "@/lib/mock-data";
import type { Lead } from "@/lib/types";
import { complianceTone, formatCurrency, scoreTone, statusTone } from "@/lib/utils";

const workflowSteps = [
  { label: "New Lead", icon: CircleDashed },
  { label: "Lead Scoring Agent", icon: Bot },
  { label: "Marketing Strategy Agent", icon: Bot },
  { label: "Outreach Agent", icon: Send },
  { label: "Security & Compliance Agent", icon: ShieldCheck },
  { label: "Reply Classifier Agent", icon: MessageSquareText },
  { label: "Owner Talking", icon: UserRoundCheck },
  { label: "Website Team", icon: Bot },
  { label: "QA + Compliance", icon: Lock },
  { label: "Client Preview", icon: CheckCircle2 },
];

export function PipelineView({ leads }: { leads: Lead[] }) {
  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-4xl">
              <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
                <Bot className="h-3.5 w-3.5" />
                Workflow engine
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-normal text-zinc-50">Automation runs before and after the owner conversation.</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                The pipeline makes the required handoff explicit: interested leads enter owner conversation, then one click sends them into intake, build, QA, compliance, preview, and delivery.
              </p>
            </div>
            <Button>
              <Bot className="h-4 w-4" />
              Run Full Workflow
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>End-to-End Automation Map</CardTitle>
          <CardDescription>Every required agent gate is represented before status changes are allowed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-[1100px] items-center gap-3">
              {workflowSteps.map((step, index) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="flex w-40 flex-col items-center rounded-[8px] border border-white/10 bg-white/5 p-3 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-white/10 bg-black/25 text-emerald-200">
                      <step.icon className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-xs font-medium leading-5 text-zinc-200">{step.label}</p>
                  </div>
                  {index < workflowSteps.length - 1 ? <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600" /> : null}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="overflow-x-auto pb-3">
        <div className="grid min-w-[1180px] grid-cols-5 gap-4">
          {workflowStages.map((stage) => {
            const stageLeads = leads.filter((lead) => stage.statuses.includes(lead.status));
            const averageScore = Math.round(stageLeads.reduce((sum, lead) => sum + lead.leadScore, 0) / Math.max(stageLeads.length, 1));

            return (
              <Card key={stage.name} className="min-h-[620px]">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>{stage.name}</CardTitle>
                      <CardDescription>{stageLeads.length} records</CardDescription>
                    </div>
                    <Badge className={scoreTone(averageScore)}>{averageScore}</Badge>
                  </div>
                  <Progress value={Math.min(100, stageLeads.length * 18)} className="mt-3" />
                </CardHeader>
                <CardContent className="space-y-3 p-3">
                  {stageLeads.map((lead) => (
                    <div key={lead.id} className="rounded-[8px] border border-white/10 bg-white/[0.055] p-3 transition hover:border-white/18 hover:bg-white/[0.075]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-100">{lead.businessName}</p>
                          <p className="mt-1 truncate text-xs text-zinc-500">
                            {lead.industry} - {lead.city}
                          </p>
                        </div>
                        <Badge className={scoreTone(lead.leadScore)}>{lead.leadScore}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge className={statusTone(lead.status)}>{lead.status}</Badge>
                        <Badge className={complianceTone(lead.complianceStatus)}>{lead.complianceStatus}</Badge>
                      </div>
                      <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-zinc-400">{lead.notes}</p>
                      <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-xs">
                        <span className="text-zinc-500">Value</span>
                        <span className="font-medium text-zinc-200">{formatCurrency(lead.estimatedValue)}</span>
                      </div>
                      {lead.status === "Interested" || lead.status === "Owner Talking" ? (
                        <Button size="sm" className="mt-3 w-full">
                          <UserRoundCheck className="h-3.5 w-3.5" />
                          Owner Step
                        </Button>
                      ) : null}
                      {lead.status === "Send to Website Team" ? (
                        <Button size="sm" className="mt-3 w-full">
                          <Send className="h-3.5 w-3.5" />
                          Send to Website Team
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  {stageLeads.length === 0 ? (
                    <div className="flex min-h-40 items-center justify-center rounded-[8px] border border-dashed border-white/12 bg-white/[0.03] p-4 text-center text-sm text-zinc-500">
                      No leads in this stage.
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { title: "Before Owner", copy: "Lead Finder, Scoring, Strategy, Outreach, Compliance, and Reply Classification run automatically.", icon: Bot },
          { title: "Owner Step", copy: "Owner talks to interested leads, adds notes, pricing notes, requirements, and manually triggers website team.", icon: UserRoundCheck },
          { title: "After Owner", copy: "Intake, Builder 1, Builder 2, QA, Compliance, Delivery, and revision prep are automated.", icon: ShieldCheck },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-5">
              <item.icon className="h-5 w-5 text-emerald-200" />
              <h3 className="mt-4 text-sm font-semibold text-zinc-100">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{item.copy}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
