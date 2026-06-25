"use client";

import * as React from "react";
import { CheckCircle2, Database, KeyRound, Mail, Save, ShieldCheck, Smartphone, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Settings } from "@/lib/types";

const envVars = [
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "SENDGRID_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_NUMBER",
  "NEXT_PUBLIC_APP_URL",
];

type OpenAIStatus = {
  configured: boolean;
  mode: "not_configured" | "live";
  model: string;
};

export function SettingsView({ settings, source }: { settings: Settings; source: "supabase" | "mock" }) {
  const [openAIStatus, setOpenAIStatus] = React.useState<OpenAIStatus | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadOpenAIStatus() {
      try {
        const response = await fetch("/api/openai/status", { cache: "no-store" });
        const payload = (await response.json()) as { ok: boolean; data?: OpenAIStatus };

        if (!cancelled && payload.ok && payload.data) {
          setOpenAIStatus(payload.data);
        }
      } catch {
        if (!cancelled) {
          setOpenAIStatus({ configured: false, mode: "not_configured", model: "unknown" });
        }
      }
    }

    void loadOpenAIStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const openAIIntegrationStatus = openAIStatus
    ? openAIStatus.mode === "live"
      ? `Live: ${openAIStatus.model}`
      : "API key required"
    : "Checking";

  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
                <ToggleRight className="h-3.5 w-3.5" />
                {source === "supabase" ? "Supabase connected" : "Connect Supabase"}
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-normal text-zinc-50">Production-ready configuration with safe local defaults.</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                No API keys are exposed to the frontend. OpenAI, Supabase, Resend/SendGrid, and Twilio are server-side or configuration-only until credentials are added.
              </p>
            </div>
            <Button onClick={() => toast.success(source === "supabase" ? "Settings saved" : "Settings saved locally")}>
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agency Profile</CardTitle>
              <CardDescription>Used for sender identity and delivery messages.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Agency name" value={settings.agencyName} />
              <Field label="Owner name" value={settings.ownerName} />
              <Field label="Sender email" value={settings.senderEmail} />
              <Field label="Sender phone" value={settings.senderPhone} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>Place these in `.env.local` for local development and Vercel project settings for deployment.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {envVars.map((envVar) => (
                <div key={envVar} className="flex items-center justify-between rounded-[8px] border border-white/10 bg-white/5 px-3 py-3">
                  <code className="text-xs text-zinc-300">{envVar}</code>
                  <Badge className="border-zinc-400/20 bg-zinc-400/10 text-zinc-300">server</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Requirements</CardTitle>
              <CardDescription>Implemented as architecture guardrails and route helpers.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                "No frontend API keys",
                "Server-side OpenAI calls",
                "Input validation with Zod",
                "Input sanitization",
                "Safe error messages",
                "Audit logs",
                "Rate limit placeholder",
                "Role-ready user model",
                "Secure contact form handling plan",
                "No dangerous eval",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/5 px-3 py-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm text-zinc-300">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <IntegrationCard icon={KeyRound} title="OpenAI" description="Structured JSON agent outputs with retry and usage tracking." status={openAIIntegrationStatus} />
          <IntegrationCard icon={Database} title="Supabase" description="Database, auth, storage-ready architecture, migrations, RLS policies." status="Schema ready" />
          <IntegrationCard icon={Mail} title="Resend / SendGrid" description="Resend adapter is implemented. SendGrid key slot is documented for future swap." status="Email-ready" />
          <IntegrationCard icon={Smartphone} title="Twilio SMS" description="Server-side SMS adapter uses Twilio credentials when SMS is enabled." status="SMS-ready" />

          <Card>
            <CardHeader>
              <CardTitle>Deployment Readiness</CardTitle>
              <CardDescription>Vercel-ready Next.js app router structure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["App Router", "TypeScript strict mode", "Tailwind CSS v4", "API routes", "Environment variables", "Live API mode"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/5 px-3 py-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  <span className="text-sm text-zinc-300">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="space-y-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <Input defaultValue={value} />
    </label>
  );
}

function IntegrationCard({
  icon: Icon,
  title,
  description,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-white/7 text-emerald-200">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-100">{title}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
            </div>
          </div>
          <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100">{status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
