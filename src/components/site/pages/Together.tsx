"use client";

import * as React from "react";
import { useStore, type TogetherMessage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/site/EmptyState";
import { Section } from "@/components/site/Section";
import { coverClass, formatConcertDate, timeAgo } from "@/lib/utils";
import { Music, Send, Flag, Info, Lock, ChevronLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { StartSpaceButton } from "@/components/site/StartSpaceDialog";

const EMOJIS = ["❤️", "😭", "🔥", "🎵", "✨"];

export function Together({ concertId, embedded }: { concertId?: string; embedded?: boolean }) {
  const { concerts, togetherMessages, sendTogetherMessage, auth, navigate, reportContent } = useStore();
  const [text, setText] = React.useState("");
  const [activeId, setActiveId] = React.useState<string | null>(concertId ?? null);
  const [frozen, setFrozen] = React.useState(false);

  // If no concertId provided, show list. If provided, show the room.
  const concert = concerts.find((c) => c.id === activeId);
  const isPast = concert ? new Date(concert.date).getTime() < Date.now() : false;
  const messages = togetherMessages.filter((m) => m.concertId === activeId);

  const send = (type: TogetherMessage["type"] = "chat") => {
    if (!auth) { navigate("auth"); return; }
    if (!activeId) return;
    if (!text.trim()) return;
    if (frozen) {
      toast.error("This room is now a read-only archive");
      return;
    }
    if (type === "song-update" && !auth.pledgeAcceptedAt) {
      toast.error("Song updates require the Respectful Crowd Pledge");
      return;
    }
    sendTogetherMessage({
      concertId: activeId,
      userId: auth.id,
      username: auth.username,
      text: text.trim(),
      type,
    });
    setText("");
  };

  if (activeId && concert) {
    return (
      <div className="space-y-4">
        {!embedded && (
          <Button variant="ghost" size="sm" onClick={() => setActiveId(null)} className="gap-1">
            <ChevronLeft className="size-4" /> All rooms
          </Button>
        )}

        <div className={`relative overflow-hidden rounded-xl ${coverClass(concert.coverIndex)}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="relative flex items-center justify-between gap-3 p-4 text-white">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-80">{concert.tour}</p>
              <p className="text-lg font-bold">{concert.artist}</p>
              <p className="text-xs opacity-80">{formatConcertDate(concert.date)}{concert.city ? ` · ${concert.city}` : ""}</p>
            </div>
            {isPast && <Badge className="bg-black/40 text-white backdrop-blur">Past</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2 text-xs">
          <Info className="size-4 text-primary" />
          <span>This is a chat room, not a live stream. No video. Just words from the crowd.</span>
        </div>

        {isPast && (
          <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs">
            <span>This room is now a read-only "night in words" archive.</span>
            <Button size="sm" variant="ghost" onClick={() => setFrozen((v) => !v)} className="h-7">
              {frozen ? "Unfreeze" : "Freeze"}
            </Button>
          </div>
        )}

        <Card className="bg-card/60">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Concert Pulse</p>
              <Badge variant="secondary">Authorized contributors</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Song updates appear with a music note and a soft pulse so you can tell them apart from chat.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => send("song-update")}
              disabled={!text.trim() || frozen}
              className="gap-1.5"
            >
              <Music className="size-4" /> Post a song update
            </Button>
          </CardContent>
        </Card>

        <div className="max-h-96 space-y-2 overflow-y-auto scroll-soft rounded-xl border border-border/40 bg-card/40 p-3">
          {messages.length === 0 ? (
            <EmptyState title="No messages yet" message="Be the first to say something kind." />
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-2 rounded-lg p-2 ${
                  m.type === "song-update"
                    ? "border border-primary/30 bg-primary/10"
                    : m.type === "pulse"
                    ? "border border-accent/30 bg-accent/10"
                    : ""
                }`}
              >
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {m.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">{m.username}</p>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(m.createdAt)}</span>
                  </div>
                  <p className="text-sm">
                    {m.type === "song-update" && (
                      <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        <Music className="size-3 animate-pulse" /> song-update
                      </span>
                    )}
                    {m.type === "pulse" && (
                      <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                        pulse
                      </span>
                    )}
                    {m.text}
                  </p>
                </div>
                <button
                  onClick={() => {
                    reportContent({ reporterId: auth?.id ?? "anon", targetType: "message", targetId: m.id, reason: "Reported from Together room" });
                    toast.success("Reported for review");
                  }}
                  className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Report"
                >
                  <Flag className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setText((t) => t + e)}
                className="rounded-md border border-border/40 px-1.5 py-0.5 text-sm transition-transform hover:scale-110"
                aria-label={`react ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send("chat"); }}
            placeholder={frozen ? "Room is frozen" : "Say something kind..."}
            disabled={frozen}
          />
          <Button onClick={() => send("chat")} disabled={frozen || !text.trim()} className="gap-1.5">
            <Send className="size-4" /> Send
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => toast.success("Muted for this room")}>
            <Lock className="size-3.5" /> Mute room
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
      <Section
        title="Together"
        description="One chat room per concert. Words only — no video, no live stream."
        action={
          <div className="flex items-center gap-2">
            {auth && <StartSpaceButton label="Start" size="sm" variant="ghost" />}
            {!auth && (
              <Button size="sm" variant="ghost" onClick={() => navigate("auth")} className="gap-1.5">
                <Plus className="size-4" /> Start
              </Button>
            )}
          </div>
        }
      >
        {concerts.length === 0 ? (
          <EmptyState
            title="No rooms yet"
            message={auth ? "Start a space — every space gets its own chat room automatically." : "Sign in to start a space — every space gets its own chat room."}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {concerts.map((c) => {
              const count = togetherMessages.filter((m) => m.concertId === c.id).length;
              const past = new Date(c.date).getTime() < Date.now();
              return (
                <button
                  key={c.id}
                  onClick={() => { setActiveId(c.id); setFrozen(false); if (!embedded) { navigate("together", { concertId: c.id }); } }}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3 text-left"
                >
                  <div className={`size-12 shrink-0 rounded-lg ${coverClass(c.coverIndex)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.artist}</p>
                    <p className="text-xs text-muted-foreground">{c.tour} · {c.city || "Unscheduled"}</p>
                    <p className="text-[10px] text-muted-foreground">{count} messages{past ? " · archive" : ""}</p>
                  </div>
                  <Button size="sm" variant="outline">Open</Button>
                </button>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
