"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  message,
  className,
  icon,
}: {
  title: string;
  message: string;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/40 px-6 py-12 text-center",
        className
      )}
    >
      <div className="relative grid size-16 place-items-center">
        <div
          className="absolute inset-0 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--primary) 50%, transparent), transparent 70%)",
          }}
        />
        <div className="relative grid size-10 place-items-center text-primary">
          {icon ?? <StarHeart />}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function StarHeart() {
  return (
    <svg viewBox="0 0 24 24" className="size-10" fill="none" aria-hidden>
      <path
        d="M12 3l2.4 5.6 6.1.5-4.6 4 1.4 6-5.3-3.2L6.7 19l1.4-6-4.6-4 6.1-.5L12 3z"
        fill="currentColor"
        opacity="0.45"
      />
      <path
        d="M12 14c-1.5-1.2-3-2.3-3-4a2 2 0 014-0 2 2 0 014 0c0 1.7-1.5 2.8-3 4l-1 .8-1-.8z"
        fill="currentColor"
      />
    </svg>
  );
}
