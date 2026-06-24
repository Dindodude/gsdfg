"use client";

import { AlertTriangle, CheckCircle2, FileWarning, Lock, Scale, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { complianceReviews } from "@/lib/mock-data";
import { cn, formatDate, riskTone } from "@/lib/utils";

const statusTone = {
  Approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  Blocked: "border-rose-400/40 bg-rose-500/15 text-rose-100",
  "Needs Fixes": "border-amber-400/30 bg-amber-400/10 text-amber-100",
};

const reviewTypes = ["Outreach messages", "Website content", "Contact forms", "Privacy policy needs", "Terms/disclaimer needs"];

export function ComplianceView() {
  const highRisk = complianceReviews.filter((review) => review.riskLevel === "High");
  const mediumRisk = complianceReviews.filter((review) => review.riskLevel === "Medium");
  const lowRisk = complianceReviews.filter((review) => review.riskLevel === "Low");

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <Badge className="border-rose-300/30 bg-rose-500/15 text-rose-100">
                <ShieldAlert className="h-3.5 w-3.5" />
                Mandatory gate
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-normal text-zinc-50">High-risk outreach and delivery are blocked until fixed.</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Reviews check sender identity, unsubscribe language, misleading claims, privacy/PIPEDA awareness, CASL-style basics, contact form security, and cookie/analytics notice needs.
              </p>
            </div>
            <Button variant="danger" onClick={() => toast.info("Compliance review queued")}>
              <ShieldCheck className="h-4 w-4" />
              Run Compliance Review
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <RiskCard label="High risk blocked" value={highRisk.length} icon={Lock} tone="rose" />
        <RiskCard label="Needs fixes" value={mediumRisk.length} icon={FileWarning} tone="amber" />
        <RiskCard label="Approved low risk" value={lowRisk.length} icon={CheckCircle2} tone="emerald" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_400px]">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Reviews</CardTitle>
            <CardDescription>Every record includes risk level, issues, fixes, status, timestamp, and agent notes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {complianceReviews.map((review) => (
              <div key={review.id} className={cn("rounded-[8px] border border-white/10 bg-white/5 p-4", review.riskLevel === "High" && "border-rose-300/30 bg-rose-500/[0.06]")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {review.riskLevel === "High" ? <Lock className="h-4 w-4 text-rose-200" /> : <Scale className="h-4 w-4 text-emerald-200" />}
                      <p className="truncate text-sm font-medium text-zinc-100">{review.targetName}</p>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {review.targetType} - {formatDate(review.timestamp)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={riskTone(review.riskLevel)}>{review.riskLevel}</Badge>
                    <Badge className={statusTone[review.status]}>{review.status}</Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{review.agentNotes}</p>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-[8px] border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-medium text-zinc-300">Issues found</p>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-zinc-500">
                      {(review.issuesFound.length ? review.issuesFound : ["No issues found"]).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[8px] border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-medium text-zinc-300">Fixes required</p>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-zinc-500">
                      {(review.fixesRequired.length ? review.fixesRequired : ["No fixes required"]).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Coverage</CardTitle>
              <CardDescription>Required review types are represented.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {reviewTypes.map((type) => (
                <div key={type} className="flex items-center justify-between rounded-[8px] border border-white/10 bg-white/5 px-3 py-3">
                  <span className="text-sm text-zinc-300">{type}</span>
                  <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">Tracked</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Review Test</CardTitle>
              <CardDescription>Paste content and simulate the compliance route.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea defaultValue="Hi, this is AgencyForge AI. We can help improve your booking flow. Reply stop to opt out." />
              <Button className="w-full" onClick={() => toast.success("Approved", { description: "Low risk. Sender identity and opt-out detected." })}>
                <ShieldCheck className="h-4 w-4" />
                Review Content
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blocked Rules</CardTitle>
              <CardDescription>High-risk output cannot be sent or delivered.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Spam-like outreach", "No unsubscribe line", "Fake guarantees", "Unsupported claims", "Insecure contact form"].map((rule) => (
                <div key={rule} className="flex gap-3 rounded-[8px] border border-white/10 bg-white/5 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-200" />
                  <span className="text-sm text-zinc-300">{rule}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function RiskCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "rose" | "amber" | "emerald";
}) {
  const color = {
    rose: "text-rose-100 border-rose-300/30 bg-rose-500/12",
    amber: "text-amber-100 border-amber-300/30 bg-amber-400/12",
    emerald: "text-emerald-100 border-emerald-300/30 bg-emerald-300/12",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-50">{value}</p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-[8px] border", color)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
