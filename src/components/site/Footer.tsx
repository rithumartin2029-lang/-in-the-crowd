"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { isLiveMode } from "@/lib/supabase";

export function Footer() {
  const { navigate } = useStore();
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium leading-relaxed text-foreground">
              For the ones who made it. For the ones who missed it. For the ones still dreaming.
            </p>
            <p className="mt-2 text-sm italic text-muted-foreground">
              Somewhere, We're All in the Crowd.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <button
              onClick={() => navigate("founder-story")}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Founder story
            </button>
            <button
              onClick={() => navigate("takedown")}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Takedown request
            </button>
            <button
              onClick={() => navigate("settings")}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Privacy &amp; settings
            </button>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-2 border-t border-border/40 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span className="flex items-center gap-2">
            © {new Date().getFullYear()} In the Crowd. A community demo.
            <Badge variant={isLiveMode ? "default" : "secondary"} className="text-[10px]">
              {isLiveMode ? "Live mode" : "Local mode"}
            </Badge>
          </span>
          <span>
            {isLiveMode
              ? "Connected to Supabase — your data syncs across devices."
              : "Local-only mode — set NEXT_PUBLIC_SUPABASE_URL to go live."}
          </span>
        </div>
      </div>
    </footer>
  );
}
