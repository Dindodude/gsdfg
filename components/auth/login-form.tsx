"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState<"login" | "signup" | null>(null);

  async function signIn() {
    if (!configured) {
      toast.error("Supabase is not configured", {
        description: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      });
      return;
    }

    setLoading("login");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(null);

    if (error) {
      toast.error("Login failed", { description: error.message });
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function signUp() {
    if (!configured) {
      toast.error("Supabase is not configured", {
        description: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      });
      return;
    }

    setLoading("signup");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (!error && data.user) {
      await fetch("/api/auth/bootstrap-user", { method: "POST" });
    }

    setLoading(null);

    if (error) {
      toast.error("Signup failed", { description: error.message });
      return;
    }

    toast.success("Account created", {
      description: data.session ? "You are signed in." : "Check your email if confirmation is enabled.",
    });
    router.push(next);
    router.refresh();
  }

  return (
    <Card className="glass-strong w-full max-w-md">
      <CardHeader>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[8px] border border-emerald-300/30 bg-emerald-300/12 text-emerald-200">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl">Sign in to AgencyForge AI</CardTitle>
        <CardDescription>Use your Supabase account to access the agency operating system.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!configured ? (
          <div className="rounded-[8px] border border-amber-300/30 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
            Supabase env vars are missing. Add them to `.env.local`, then restart the dev server.
          </div>
        ) : null}
        <label className="space-y-2">
          <span className="text-xs text-zinc-500">Email</span>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </label>
        <label className="space-y-2">
          <span className="text-xs text-zinc-500">Password</span>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 6 characters" />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button disabled={loading !== null || !email || !password} onClick={signIn}>
            <Mail className="h-4 w-4" />
            {loading === "login" ? "Signing in..." : "Sign In"}
          </Button>
          <Button disabled={loading !== null || !email || !password} variant="secondary" onClick={signUp}>
            <UserPlus className="h-4 w-4" />
            {loading === "signup" ? "Creating..." : "Sign Up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
