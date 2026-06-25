"use client";

import { Check, ClipboardCheck, Clock, MessageSquareText, PenLine, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ComplianceReview, Task } from "@/lib/types";
import { cn, formatDate, priorityTone, riskTone } from "@/lib/utils";

export function TasksView({ tasks, complianceReviews }: { tasks: Task[]; complianceReviews: ComplianceReview[] }) {
  const openTasks = tasks.filter((task) => task.status !== "Done");
  const warningReviews = complianceReviews.filter((review) => review.status !== "Approved");

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <Badge className="border-amber-300/30 bg-amber-300/10 text-amber-100">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Owner control center
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-normal text-zinc-50">Only the human-required decisions land here.</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Approval queue, compliance warning queue, manual overrides, lead notes, conversation notes, requirements, and pricing notes are available in one operator view.
              </p>
            </div>
            <Button onClick={() => toast.success("Top task opened")}>
              <Clock className="h-4 w-4" />
              Start Next Task
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Open tasks" value={openTasks.length} />
        <Metric label="Critical" value={tasks.filter((task) => task.priority === "Critical").length} />
        <Metric label="Compliance warnings" value={warningReviews.length} />
        <Metric label="Owner approvals" value={tasks.filter((task) => task.action.includes("approval") || task.action.includes("Prepare")).length} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Task Queue</CardTitle>
            <CardDescription>Sorted by business impact and compliance urgency.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-[8px] border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">{task.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {task.relatedLead ?? "System"} - due {formatDate(task.dueAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={priorityTone(task.priority)}>{task.priority}</Badge>
                    <Badge className="border-white/10 bg-white/6 text-zinc-300">{task.status}</Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{task.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm">
                    <Check className="h-3.5 w-3.5" />
                    {task.action}
                  </Button>
                  <Button size="sm" variant="secondary">
                    <PenLine className="h-3.5 w-3.5" />
                    Add Notes
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Warning Queue</CardTitle>
              <CardDescription>Warnings must be fixed before send or delivery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {warningReviews.map((review) => (
                <div key={review.id} className={cn("rounded-[8px] border border-white/10 bg-white/5 p-3", review.riskLevel === "High" && "border-rose-300/30 bg-rose-500/[0.06]")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">{review.targetName}</p>
                      <p className="mt-1 text-xs text-zinc-500">{review.targetType}</p>
                    </div>
                    <Badge className={riskTone(review.riskLevel)}>{review.riskLevel}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">{review.agentNotes}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Override</CardTitle>
              <CardDescription>For owner-controlled status changes and pricing context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <select className="h-10 w-full rounded-[8px] border border-white/10 bg-white/7 px-3 text-sm text-zinc-100 outline-none">
                <option className="bg-zinc-950">Move to Owner Talking</option>
                <option className="bg-zinc-950">Send to Website Team</option>
                <option className="bg-zinc-950">Mark Compliance Review</option>
                <option className="bg-zinc-950">Mark Closed Won</option>
              </select>
              <Textarea placeholder="Owner notes, client requirements, pricing notes..." />
              <Button variant="secondary" className="w-full" onClick={() => toast.success("Manual override logged")}>
                <ShieldAlert className="h-4 w-4" />
                Apply Override + Audit Log
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation Notes</CardTitle>
              <CardDescription>Intake agent uses this after owner approval.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea defaultValue="Lead wants a premium site, clear pricing, booking CTA, three service pages, FAQ, and a simple launch timeline." />
              <Button className="w-full">
                <Send className="h-4 w-4" />
                Send Notes to Website Intake
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-50">{value}</p>
        </div>
        <MessageSquareText className="h-5 w-5 text-emerald-200" />
      </CardContent>
    </Card>
  );
}
