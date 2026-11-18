"use client";

import * as React from "react";
import { Shield, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export function SpoilerShield({
  active,
  children,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [revealed, setRevealed] = React.useState(false);

  if (!active) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      <div className={cn("spoiler-blur", revealed && "revealed")}>{children}</div>
      {!revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-card/30 text-center text-xs font-medium backdrop-blur-[2px]"
        >
          <Shield className="size-5 text-primary" />
          Spoiler hidden. Tap to reveal.
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Eye className="size-3" /> Just this one
          </span>
        </button>
      )}
    </div>
  );
}
