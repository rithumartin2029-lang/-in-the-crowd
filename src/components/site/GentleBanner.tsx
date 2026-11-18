"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

export function GentleBanner() {
  const { gentleMode, toggleGentleMode } = useStore();
  if (!gentleMode) return null;
  return (
    <div className="border-b border-accent/30 bg-accent/10 px-4 py-2 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-accent-foreground">
          <Sparkles className="size-4 text-accent" />
          <span>
            <strong>Take your time.</strong>{" "}
            <span className="text-muted-foreground">Music waits for you. So do we.</span>
          </span>
        </p>
        <Button size="sm" variant="ghost" onClick={() => toggleGentleMode(false)} className="h-7 gap-1 px-2 text-xs">
          <X className="size-3" /> Turn off
        </Button>
      </div>
    </div>
  );
}
