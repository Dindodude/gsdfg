"use client";

import * as React from "react";
import { Mail, MessageSquareReply, Phone, Send, ShieldCheck, Sparkles, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Lead, OutreachMessage, Reply } from "@/lib/types";
import { cn, complianceTone, formatDate, statusTone } from "@/lib/utils";

const channelIcon = {
  Email: Mail,
  SMS: Phone,
  DM: MessageSquareReply,
};

export function OutreachView({
  leads,
  outreachMessages,
  replies,
}: {
  leads: Lead[];
  outreachMessages: OutreachMessage[];
  replies: Reply[];
}) {
  const [selectedLead, setSelectedLead] = React.useState(leads[0]?.id ?? "");
  const lead = leads.find((item) => item.id === selectedLead) ?? leads[0];
  const leadMessages = lead ? outreachMessages.filter((message) => message.leadId === lead.id) : [];

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Compliance-gated outreach
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-normal text-zinc-50">Outreach is generated automatically, but blocked when risk is high.</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                The Outreach Agent writes email, SMS, follow-ups, and DMs. The Security & Compliance Agent must approve before sending.
              </p>
            </div>
            <Button onClick={() => toast.success("Outreach generated", { description: "Security & Compliance Agent is reviewing before send." })}>
              <Sparkles className="h-4 w-4" />
              Generate Outreach
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[400px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Message Set</CardTitle>
              <CardDescription>Pick a lead and generate all outreach variants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={selectedLead}
                onChange={(event) => setSelectedLead(event.target.value)}
                className="h-10 w-full rounded-[8px] border border-white/10 bg-white/7 px-3 text-sm text-zinc-100 outline-none"
              >
                {leads
                  .filter((item) => item.status !== "Closed Lost")
                  .slice(0, 14)
                  .map((item) => (
                    <option key={item.id} value={item.id} className="bg-zinc-950">
                      {item.businessName}
                    </option>
                  ))}
              </select>
              {lead ? (
              <div className="rounded-[8px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-zinc-100">{lead.businessName}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {lead.industry} - {lead.city}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={statusTone(lead.status)}>{lead.status}</Badge>
                  <Badge className={complianceTone(lead.complianceStatus)}>{lead.complianceStatus}</Badge>
                </div>
              </div>
              ) : null}
              <Input value="Conversion-first local website angle" readOnly />
              <Textarea defaultValue={lead ? `Use ${lead.businessName}'s website quality score and Google presence to write specific, respectful outreach. Include sender identity and opt-out language.` : "Add leads first, then generate compliant outreach."} />
              <Button className="w-full" onClick={() => toast.success("Mock outreach ready", { description: "Email, SMS, follow-ups, DM, and compliance checklist created." })}>
                <Send className="h-4 w-4" />
                Generate + Review Compliance
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reply Classifier</CardTitle>
              <CardDescription>Classifies replies and moves interested leads to owner queue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Paste a reply..." defaultValue="Can you send the example and pricing? We may need a booking page." />
              <Button variant="secondary" className="w-full" onClick={() => toast.success("Reply classified", { description: "Interested with 91% confidence." })}>
                <MessageSquareReply className="h-4 w-4" />
                Classify Reply
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outreach Messages</CardTitle>
              <CardDescription>Drafts, approvals, sent messages, and blocked items.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {(leadMessages.length > 0 ? leadMessages : outreachMessages).map((message) => {
                const Icon = channelIcon[message.channel];
                const blocked = message.status === "Blocked" || message.complianceStatus === "Blocked";
                return (
                  <div key={message.id} className={cn("rounded-[8px] border border-white/10 bg-white/5 p-4", blocked && "border-rose-300/30 bg-rose-500/[0.06]")}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", blocked ? "text-rose-200" : "text-emerald-200")} />
                          <p className="truncate text-sm font-medium text-zinc-100">{message.leadName}</p>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {message.channel} - {formatDate(message.scheduledFor)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={complianceTone(message.complianceStatus)}>{message.complianceStatus}</Badge>
                        <Badge className={cn("border-white/10 bg-white/6 text-zinc-300", blocked && "border-rose-400/40 bg-rose-500/15 text-rose-100")}>
                          {message.status}
                        </Badge>
                      </div>
                    </div>
                    {message.subject ? <p className="mt-4 text-sm font-medium text-zinc-200">{message.subject}</p> : null}
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{message.body}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {blocked ? (
                        <Button size="sm" variant="danger">
                          <StopCircle className="h-3.5 w-3.5" />
                          Blocked
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Approved
                        </Button>
                      )}
                      <Button size="sm">
                        <Send className="h-3.5 w-3.5" />
                        Send
                      </Button>
                    </div>
                  </div>
                );
              })}
              {outreachMessages.length === 0 ? (
                <div className="rounded-[8px] border border-dashed border-white/12 bg-white/[0.03] p-6 text-sm text-zinc-500">
                  No outreach messages saved yet.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Replies</CardTitle>
              <CardDescription>Interested replies move into owner conversation.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {replies.map((reply) => (
                <div key={reply.id} className="rounded-[8px] border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">{reply.leadName}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {reply.channel} - {formatDate(reply.receivedAt)}
                      </p>
                    </div>
                    <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-100">
                      {reply.classification} {reply.confidence}%
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{reply.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
