"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { navigation, quickCommands } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || event.key === "/") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange, open]);

  function runAction(action?: string, href?: string) {
    onOpenChange(false);

    if (href) {
      router.push(href);
      return;
    }

    if (action === "run-agents") {
      toast.success("Agent swarm queued", {
        description: "Lead scoring, strategy, outreach, and compliance gates will run through live APIs.",
      });
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="glass-strong fixed left-1/2 top-20 z-50 w-[min(720px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-[8px]">
          <Command className="bg-transparent">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Search className="h-4 w-4 text-emerald-200" />
              <Command.Input
                autoFocus
                placeholder="Search pages, agents, tasks, and actions..."
                className="h-10 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              <kbd className="rounded-[6px] border border-white/10 bg-white/6 px-2 py-1 text-[11px] text-zinc-400">Esc</kbd>
            </div>
            <Command.List className="max-h-[420px] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-sm text-zinc-400">No command found.</Command.Empty>
              <Command.Group heading="Navigate" className="text-xs text-zinc-500 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                {navigation.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={item.label}
                    onSelect={() => runAction(undefined, item.href)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-3 text-sm text-zinc-200 outline-none",
                      "data-[selected=true]:bg-white/10 data-[selected=true]:text-white",
                    )}
                  >
                    <item.icon className="h-4 w-4 text-zinc-400" />
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Actions" className="text-xs text-zinc-500 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                {quickCommands.map((command) => (
                  <Command.Item
                    key={command.label}
                    value={command.label}
                    onSelect={() => runAction(command.action, command.href)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-3 text-sm text-zinc-200 outline-none",
                      "data-[selected=true]:bg-white/10 data-[selected=true]:text-white",
                    )}
                  >
                    <command.icon className="h-4 w-4 text-emerald-200" />
                    {command.label}
                  </Command.Item>
                ))}
                <Command.Item
                  value="Start lead batch"
                  onSelect={() => runAction("run-agents")}
                  className="flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-3 text-sm text-zinc-200 outline-none data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                >
                  <Sparkles className="h-4 w-4 text-amber-200" />
                  Start lead batch
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
