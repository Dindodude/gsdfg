"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bot, CalendarClock, ClipboardList, DatabaseZap, Filter, Plus, Search, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Lead } from "@/lib/types";
import { cn, complianceTone, formatCurrency, formatDate, scoreTone, statusTone } from "@/lib/utils";

export function LeadsView({ leads, source }: { leads: Lead[]; source: "supabase" | "mock" }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("All");
  const [loading, setLoading] = React.useState<string | null>(null);
  const priorityLeads = React.useMemo(() => [...leads].sort((a, b) => b.leadScore - a.leadScore).slice(0, 6), [leads]);
  const [selectedLeadId, setSelectedLeadId] = React.useState(priorityLeads[0]?.id ?? leads[0]?.id ?? "");
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];

  const statuses = ["All", ...Array.from(new Set(leads.map((lead) => lead.status)))];
  const filtered = leads.filter((lead) => {
    const haystack = `${lead.businessName} ${lead.industry} ${lead.city} ${lead.email}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesStatus = status === "All" || lead.status === status;
    return matchesQuery && matchesStatus;
  });

  async function scoreLead() {
    if (!selectedLead) return;
    setLoading("score");
    const response = await fetch("/api/leads/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: selectedLead.id }),
    });
    setLoading(null);

    if (!response.ok) {
      toast.error("Lead scoring failed");
      return;
    }

    toast.success("Lead scored", { description: "Score and status were saved when Supabase is connected." });
    router.refresh();
  }

  async function sendToWebsiteTeam() {
    if (!selectedLead) return;
    setLoading("website");
    const response = await fetch("/api/websites/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: selectedLead.id,
        ownerNotes: selectedLead.notes || "Owner approved this lead for the website team.",
      }),
    });
    setLoading(null);

    if (!response.ok) {
      toast.error("Website handoff failed");
      return;
    }

    toast.success("Sent to Website Team", { description: "Website intake and page drafts were saved." });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="glass-strong">
          <CardContent className="p-6 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
                  <DatabaseZap className="h-3.5 w-3.5" />
                  {source === "supabase" ? "Live Supabase leads" : "25 seeded leads"}
                </Badge>
                <h2 className="mt-4 text-3xl font-semibold tracking-normal text-zinc-50">Lead database built for autonomous qualification.</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Store business identity, website signals, contact data, source, scoring, follow-ups, notes, and compliance status in one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => toast.info("Manual import drawer is mocked for local mode")}>
                  <Plus className="h-4 w-4" />
                  Import Lead
                </Button>
                <Button onClick={() => toast.success("Mock leads generated", { description: "Lead Finder Agent added a new batch in mock mode." })}>
                  <Sparkles className="h-4 w-4" />
                  Generate Mock Leads
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Intake Modes</CardTitle>
            <CardDescription>Manual now, external lead sources ready later.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {["Manual import", "CSV import ready", "Google Maps/API future", "External lead APIs future"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-[8px] border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-sm text-zinc-300">{item}</span>
                <Badge className="border-white/10 bg-white/6 text-zinc-300">Ready</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-white/10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Lead Records</CardTitle>
                <CardDescription>Search and triage all required lead fields.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads..." className="w-full pl-9 sm:w-64" />
                </div>
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="h-10 w-full rounded-[8px] border border-white/10 bg-white/7 pl-9 pr-8 text-sm text-zinc-100 outline-none sm:w-56"
                  >
                    {statuses.map((item) => (
                      <option key={item} value={item} className="bg-zinc-950">
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                    <th className="px-5 py-4 font-medium">Business</th>
                    <th className="px-5 py-4 font-medium">Scores</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Compliance</th>
                    <th className="px-5 py-4 font-medium">Contact</th>
                    <th className="px-5 py-4 font-medium">Next follow-up</th>
                    <th className="px-5 py-4 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={cn(
                        "cursor-pointer border-t border-white/10 transition hover:bg-white/[0.045]",
                        selectedLead.id === lead.id && "bg-emerald-300/[0.055]",
                      )}
                    >
                      <td className="border-t border-white/8 px-5 py-4">
                        <div className="max-w-[260px]">
                          <p className="truncate text-sm font-medium text-zinc-100">{lead.businessName}</p>
                          <p className="mt-1 truncate text-xs text-zinc-500">
                            {lead.industry} - {lead.city}
                          </p>
                          <p className="mt-1 truncate text-xs text-zinc-600">{lead.source}</p>
                        </div>
                      </td>
                      <td className="border-t border-white/8 px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge className={scoreTone(lead.leadScore)}>Lead {lead.leadScore}</Badge>
                          <Badge className="border-white/10 bg-white/6 text-zinc-300">Site {lead.currentWebsiteQualityScore}</Badge>
                          <Badge className="border-white/10 bg-white/6 text-zinc-300">Google {lead.googlePresenceScore}</Badge>
                        </div>
                      </td>
                      <td className="border-t border-white/8 px-5 py-4">
                        <Badge className={statusTone(lead.status)}>{lead.status}</Badge>
                      </td>
                      <td className="border-t border-white/8 px-5 py-4">
                        <Badge className={complianceTone(lead.complianceStatus)}>{lead.complianceStatus}</Badge>
                      </td>
                      <td className="border-t border-white/8 px-5 py-4">
                        <p className="text-xs text-zinc-300">{lead.email}</p>
                        <p className="mt-1 text-xs text-zinc-500">{lead.phone}</p>
                      </td>
                      <td className="border-t border-white/8 px-5 py-4 text-sm text-zinc-300">{formatDate(lead.nextFollowUpDate)}</td>
                      <td className="border-t border-white/8 px-5 py-4 text-sm font-medium text-zinc-100">{formatCurrency(lead.estimatedValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedLead ? (
          <Card>
            <CardHeader>
              <CardTitle>Owner Control Panel</CardTitle>
              <CardDescription>Manual owner input starts after interest is detected.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[8px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-zinc-100">{selectedLead.businessName}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {selectedLead.industry} - {selectedLead.city}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={scoreTone(selectedLead.leadScore)}>Score {selectedLead.leadScore}</Badge>
                  <Badge className={statusTone(selectedLead.status)}>{selectedLead.status}</Badge>
                  <Badge className={complianceTone(selectedLead.complianceStatus)}>{selectedLead.complianceStatus}</Badge>
                </div>
              </div>

              <Textarea defaultValue={selectedLead.notes} placeholder="Conversation notes, requirements, pricing notes..." />

              <div className="grid gap-2">
                <Button disabled={loading === "score"} onClick={scoreLead}>
                  <Bot className="h-4 w-4" />
                  {loading === "score" ? "Scoring..." : "Run Lead Scoring"}
                </Button>
                <Button
                  variant="secondary"
                  disabled={loading === "website"}
                  onClick={sendToWebsiteTeam}
                >
                  <Send className="h-4 w-4" />
                  {loading === "website" ? "Sending..." : "Send to Website Team"}
                </Button>
              </div>
            </CardContent>
          </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Leads Yet</CardTitle>
                <CardDescription>Add leads in Supabase or use the import flow once persistence writes are enabled.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-[8px] border border-dashed border-white/12 bg-white/[0.03] p-6 text-sm leading-6 text-zinc-400">
                  Your authenticated workspace is connected, but the `leads` table has no rows for this user yet.
                </div>
              </CardContent>
            </Card>
          )}

          {selectedLead ? (
          <Card>
            <CardHeader>
              <CardTitle>Selected Lead Details</CardTitle>
              <CardDescription>All required fields remain visible for operator context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Detail icon={ClipboardList} label="Website" value={selectedLead.websiteUrl ?? "No website found"} />
              <Detail icon={CalendarClock} label="Last contacted" value={formatDate(selectedLead.lastContacted)} />
              <Detail icon={CalendarClock} label="Next follow-up" value={formatDate(selectedLead.nextFollowUpDate)} />
              <Detail icon={DatabaseZap} label="Social links" value={selectedLead.socialLinks.join(", ") || "None"} />
            </CardContent>
          </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-[8px] border border-white/10 bg-white/5 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="mt-1 break-words text-sm text-zinc-200">{value}</p>
      </div>
    </div>
  );
}
