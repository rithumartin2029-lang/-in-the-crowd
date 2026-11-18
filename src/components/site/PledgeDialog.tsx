"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Heart, Sparkles } from "lucide-react";

const PLEDGE = [
  "I will never mock or look down on someone who missed a concert. They belong in this crowd as much as anyone.",
  "I will not spoil setlists or moments for people who haven't seen them yet — I'll use spoiler tags when I share.",
  "I will not pressure anyone to connect, share personal details, or meet up. Connection here is always optional.",
  "I will treat every fan — front row or watching from home — as part of the crowd.",
];

export function PledgeDialog({
  open,
  onOpenChange,
  onAccept,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAccept: () => void;
  onCancel?: () => void;
}) {
  const [ticks, setTicks] = React.useState<boolean[]>([false, false, false, false]);
  const allTicked = ticks.every(Boolean);

  React.useEffect(() => {
    if (open) setTicks([false, false, false, false]);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="size-5" /> The Respectful Crowd Pledge
          </DialogTitle>
          <DialogDescription>
            Four small promises. You only need to make them once.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {PLEDGE.map((p, i) => (
            <label
              key={i}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-card/40 p-3 transition-colors hover:border-primary/40"
            >
              <Checkbox
                checked={ticks[i]}
                onCheckedChange={(v) => setTicks((t) => t.map((x, idx) => (idx === i ? Boolean(v) : x)))}
              />
              <span className="text-sm leading-relaxed">{p}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Maybe later
            </Button>
          )}
          <Button onClick={onAccept} disabled={!allTicked} className="gap-2">
            <Heart className="size-4" /> I'm in
          </Button>
        </DialogFooter>
        {!allTicked && (
          <p className="text-center text-xs text-muted-foreground">
            Tick all four to join the crowd.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { PLEDGE };
