"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { formatCountdown } from "@/lib/utils";

export function CountdownInline({ date }: { date: string }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const t = formatCountdown(new Date(date).getTime() - now + now);
  // simpler: recompute using now
  const remaining = new Date(date).getTime() - now;
  if (remaining <= 0) return <p className="text-xs font-bold text-primary">I WAS THERE!</p>;
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((remaining % (1000 * 60)) / 1000);
  void t;
  return (
    <p className="text-xs tabular-nums text-muted-foreground">
      {days}d {String(hours).padStart(2, "0")}h {String(mins).padStart(2, "0")}m {String(secs).padStart(2, "0")}s
    </p>
  );
}

export function CountdownInlineAdd() {
  const { navigate } = useStore();
  return (
    <button
      onClick={() => navigate("countdown")}
      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 p-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      + Add countdown
    </button>
  );
}
