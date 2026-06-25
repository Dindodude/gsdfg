import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">AgencyForge AI</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-50">Owner login</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Sign in to manage leads, agent workflows, compliance gates, website generation, and delivery.
          </p>
        </div>
        <Suspense fallback={<div className="glass-strong h-80 w-full max-w-md rounded-[8px]" />}>
          <LoginForm configured={isSupabaseConfigured()} />
        </Suspense>
      </div>
    </main>
  );
}
