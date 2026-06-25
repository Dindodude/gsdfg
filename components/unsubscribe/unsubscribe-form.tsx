"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MailX, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UnsubscribeForm({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function unsubscribe() {
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data?: { email?: string; reason?: string };
      error?: string;
    };

    if (!response.ok || !payload.ok) {
      setStatus("error");
      setMessage(payload.data?.reason ?? payload.error ?? "This unsubscribe link could not be verified.");
      return;
    }

    setStatus("done");
    setMessage(`${payload.data?.email ?? email} has been added to the do-not-contact list.`);
  }

  return (
    <div className="glass-strong w-full max-w-xl rounded-[2rem] border border-white/10 p-6 shadow-2xl shadow-emerald-950/20 md:p-8">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-300/10 text-emerald-200">
        <MailX className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">AgencyForge AI</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">Email preferences</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Confirm that you want to stop receiving cold outreach emails from this agency workspace.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Address</p>
        <p className="mt-2 break-all font-medium text-zinc-100">{email || "Email from signed link"}</p>
      </div>

      {message ? (
        <div
          className={`mt-5 flex gap-3 rounded-2xl border p-4 text-sm ${
            status === "done"
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
              : "border-amber-300/20 bg-amber-300/10 text-amber-100"
          }`}
        >
          {status === "done" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <ShieldAlert className="mt-0.5 h-4 w-4" />}
          <span>{message}</span>
        </div>
      ) : null}

      <Button
        className="mt-6 w-full rounded-2xl bg-emerald-300 text-zinc-950 hover:bg-emerald-200"
        disabled={status === "loading" || status === "done" || !token}
        onClick={unsubscribe}
      >
        {status === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailX className="mr-2 h-4 w-4" />}
        Unsubscribe
      </Button>
    </div>
  );
}
