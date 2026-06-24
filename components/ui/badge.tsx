import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-[8px] border px-2.5 py-1 text-xs font-medium leading-none",
        className,
      )}
      {...props}
    />
  );
}
