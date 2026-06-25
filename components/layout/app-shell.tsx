"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronRight, Command, Menu, PanelLeftClose, Rocket, Send, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/layout/command-palette";
import { navigation } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  userEmail,
  dataSource = "mock",
}: {
  children: React.ReactNode;
  userEmail?: string | null;
  dataSource?: "supabase" | "mock";
}) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const current = navigation.find((item) => pathname.startsWith(item.href)) ?? navigation[0];

  function queueAgents() {
    toast.success("Run Agents queued", {
      description: "Mock workflow: scoring, strategy, outreach, compliance, and website agents are ready.",
    });
  }

  function sendToWebsiteTeam() {
    toast.success("Lead sent to Website Team", {
      description: "Website Intake, Builder 1, Builder 2, QA, and Compliance are queued.",
    });
  }

  return (
    <div className="min-h-screen text-zinc-100">
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <div className="mx-auto grid min-h-screen max-w-[1800px] lg:grid-cols-[280px_1fr]">
        <aside className="sticky top-0 hidden h-screen border-r border-white/10 bg-black/18 px-4 py-5 backdrop-blur-2xl lg:block">
          <SidebarContent pathname={pathname} />
        </aside>

        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", damping: 24, stiffness: 260 }}
                className="glass-strong h-full w-[min(320px,88vw)] border-r border-white/10 px-4 py-5"
                onClick={(event) => event.stopPropagation()}
              >
                <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </motion.aside>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070809]/82 backdrop-blur-2xl">
            <div className="flex min-h-20 flex-wrap items-center gap-3 px-4 py-4 sm:px-6 xl:px-8">
              <Button variant="secondary" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                <Menu className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  AgencyForge AI <ChevronRight className="h-3 w-3" /> <span className="text-zinc-300">{current.label}</span>
                </div>
                <h1 className="mt-1 truncate text-xl font-semibold tracking-normal text-zinc-50 sm:text-2xl">{current.label}</h1>
              </div>
              <Button variant="secondary" className="hidden sm:inline-flex" onClick={() => setCommandOpen(true)}>
                <Command className="h-4 w-4" />
                Command
                <kbd className="ml-1 rounded-[5px] border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] text-zinc-400">K</kbd>
              </Button>
              <Button variant="secondary" size="icon" aria-label="Notifications" onClick={() => toast.info("No new system alerts")}>
                <Bell className="h-4 w-4" />
              </Button>
              <a
                href="/logout"
                className="hidden rounded-[8px] border border-white/10 bg-white/7 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white xl:block"
              >
                {userEmail ?? (dataSource === "supabase" ? "Sign out" : "Mock mode")}
              </a>
              <Button variant="secondary" className="hidden md:inline-flex" onClick={queueAgents}>
                <Sparkles className="h-4 w-4" />
                Run Agents
              </Button>
              <Button className="hidden md:inline-flex" onClick={sendToWebsiteTeam}>
                <Send className="h-4 w-4" />
                Send to Website Team
              </Button>
              <Button size="icon" className="md:hidden" onClick={queueAgents} aria-label="Run agents">
                <Zap className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 xl:px-8">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mx-auto max-w-[1500px]"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" onClick={onNavigate} className="group flex items-center gap-3 rounded-[8px] px-2 py-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-emerald-300/30 bg-emerald-300/12 text-emerald-200 shadow-[0_0_32px_rgba(110,231,183,0.14)]">
          <Rocket className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-50">AgencyForge AI</div>
          <div className="truncate text-xs text-zinc-500">Autonomous web agency OS</div>
        </div>
      </Link>

      <nav className="mt-7 space-y-1">
        {navigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex h-11 items-center gap-3 rounded-[8px] px-3 text-sm transition",
                active
                  ? "border border-white/10 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-zinc-400 hover:bg-white/6 hover:text-zinc-100",
              )}
            >
              <item.icon className={cn("h-4 w-4", active ? "text-emerald-200" : "text-zinc-500 group-hover:text-zinc-300")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-[8px] border border-white/10 bg-white/6 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-zinc-200">Automation Mode</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">Mock agents active until API keys are added.</p>
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
          </div>
        </div>
        <button className="flex w-full items-center justify-between rounded-[8px] border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/8 hover:text-zinc-200">
          <span>Collapse ready</span>
          <PanelLeftClose className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
