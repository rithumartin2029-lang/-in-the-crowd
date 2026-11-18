"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Music, MapPin, Calendar, Users, Info } from "lucide-react";
import { toast } from "sonner";

/**
 * Global "Start a space" dialog. Opens from anywhere via the Zustand
 * `startSpaceOpen` UI flag (set with `setStartSpaceOpen(true)`).
 *
 * A "space" is a concert entry — when a signed-in user adds one, the
 * store auto-creates the concert, an artist community (if the artist is
 * new), a Together chat room, and a memory library. Other users can then
 * find the space in Explore and join it.
 */
export function StartSpaceDialog() {
  const { startSpaceOpen, setStartSpaceOpen, auth, addConcert, navigate, artists } = useStore();

  const [artist, setArtist] = React.useState("");
  const [tour, setTour] = React.useState("");
  const [date, setDate] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [city, setCity] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [visibility, setVisibility] = React.useState<"public" | "connections" | "private">("public");

  // Reset form whenever the dialog opens
  React.useEffect(() => {
    if (startSpaceOpen) {
      setArtist("");
      setTour("");
      setDate("");
      setVenue("");
      setCity("");
      setNotes("");
      setVisibility("public");
    }
  }, [startSpaceOpen]);

  // If user isn't signed in, redirect to auth instead of showing the form
  React.useEffect(() => {
    if (startSpaceOpen && !auth) {
      setStartSpaceOpen(false);
      navigate("auth");
      toast("Sign in to start a space", { description: "You need an account to create a space." });
    }
  }, [startSpaceOpen, auth, setStartSpaceOpen, navigate]);

  if (!auth) return null;

  // Suggestions from existing artists (free text is also allowed)
  const suggestions = artists
    .filter((a) => artist.trim() && a.name.toLowerCase().includes(artist.trim().toLowerCase()))
    .slice(0, 4);

  const submit = () => {
    if (!artist.trim()) {
      toast.error("Add an artist name", { description: "Even a one-word name is enough to start." });
      return;
    }
    if (!tour.trim()) {
      toast.error("Add a concert or tour name", { description: "e.g. 'First Night Tour' or 'Live at the Garage'." });
      return;
    }
    const id = addConcert({
      artist: artist.trim(),
      tour: tour.trim(),
      date: date || undefined,
      venue,
      city,
      notes,
      visibility,
    });
    if (!id) {
      toast.error("Something went wrong", { description: "Could not create the space." });
      return;
    }
    toast.success("Your space is live", {
      description: `${artist.trim()} — ${tour.trim()} is now open for others to join.`,
    });
    setStartSpaceOpen(false);
    navigate("concert-detail", { concertId: id });
  };

  return (
    <Dialog open={startSpaceOpen} onOpenChange={setStartSpaceOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="size-5" /> Start a space
          </DialogTitle>
          <DialogDescription>
            Add a concert and open a space around it — a chat room, a memory library, and an artist community come alive automatically. Others can find it and join.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ARTIST */}
          <div className="space-y-1.5">
            <Label htmlFor="ss-artist" className="flex items-center gap-1.5">
              <Music className="size-3.5" /> Artist or band name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ss-artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. Lumina Sky"
              autoFocus
            />
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground">Existing:</span>
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setArtist(s.name)}
                    className="rounded-full border border-border/60 bg-card/60 px-2 py-0.5 text-xs hover:border-primary/40"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TOUR / CONCERT NAME */}
          <div className="space-y-1.5">
            <Label htmlFor="ss-tour" className="flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Concert or tour name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ss-tour"
              value={tour}
              onChange={(e) => setTour(e.target.value)}
              placeholder="e.g. Paper Lanterns Tour, Live at the Garage, Open Mic Night..."
            />
          </div>

          {/* DATE + CITY */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ss-date" className="flex items-center gap-1.5">
                <Calendar className="size-3.5" /> Date <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="ss-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                {date
                  ? new Date(date).getTime() < Date.now()
                    ? "Will be shown as a past show."
                    : "Will be shown as upcoming with a countdown."
                  : "Leave blank for an unscheduled space."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ss-city" className="flex items-center gap-1.5">
                <MapPin className="size-3.5" /> City <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="ss-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Reykjavik"
              />
            </div>
          </div>

          {/* VENUE */}
          <div className="space-y-1.5">
            <Label htmlFor="ss-venue" className="flex items-center gap-1.5">
              <MapPin className="size-3.5" /> Venue <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="ss-venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. The Bluebell Theatre"
            />
          </div>

          {/* NOTES */}
          <div className="space-y-1.5">
            <Label htmlFor="ss-notes" className="flex items-center gap-1.5">
              <Info className="size-3.5" /> Notes <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="ss-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What's this night about? A line or two for people thinking of joining."
            />
          </div>

          {/* VISIBILITY */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Users className="size-3.5" /> Who can find this space?
            </Label>
            <RadioGroup
              value={visibility}
              onValueChange={(v) => setVisibility(v as typeof visibility)}
              className="grid gap-2"
            >
              <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-sm transition-colors ${visibility === "public" ? "border-primary/60 bg-primary/5" : "border-border/60 hover:border-primary/30"}`}>
                <RadioGroupItem value="public" id="ss-vis-public" className="mt-1" />
                <div>
                  <p className="font-medium">Public — anyone can join</p>
                  <p className="text-xs text-muted-foreground">Appears in Explore. Marked as &ldquo;Added by a fan&rdquo;.</p>
                </div>
              </label>
              <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-sm transition-colors ${visibility === "connections" ? "border-primary/60 bg-primary/5" : "border-border/60 hover:border-primary/30"}`}>
                <RadioGroupItem value="connections" id="ss-vis-conn" className="mt-1" />
                <div>
                  <p className="font-medium">Connections only</p>
                  <p className="text-xs text-muted-foreground">Only your accepted connections can find and join.</p>
                </div>
              </label>
              <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-sm transition-colors ${visibility === "private" ? "border-primary/60 bg-primary/5" : "border-border/60 hover:border-primary/30"}`}>
                <RadioGroupItem value="private" id="ss-vis-priv" className="mt-1" />
                <div>
                  <p className="font-medium">Private — just me</p>
                  <p className="text-xs text-muted-foreground">A personal scrapbook space. No one else can find it.</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border/40 bg-card/40 p-2 text-xs text-muted-foreground">
            <Sparkles className="size-4 shrink-0 text-primary" />
            <span>
              Starting a space creates the concert page, an empty memory library, and a text-based Together room. No live video — just words from the crowd.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setStartSpaceOpen(false)}>Cancel</Button>
          <Button onClick={submit} className="gap-1.5">
            <Sparkles className="size-4" /> Open the space
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Compact trigger button reused across Home / Explore / My Space / Header. */
export function StartSpaceButton({
  label = "Start a space",
  size = "default",
  variant = "default",
  className = "",
}: {
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost";
  className?: string;
}) {
  const setStartSpaceOpen = useStore((s) => s.setStartSpaceOpen);
  return (
    <Button
      size={size}
      variant={variant}
      className={`gap-1.5 ${className}`}
      onClick={() => setStartSpaceOpen(true)}
    >
      <Sparkles className="size-4" /> {label}
    </Button>
  );
}

/** Badge that labels user-created concerts. */
export function StartedByBadge({ username }: { username: string }) {
  return (
    <Badge variant="secondary" className="gap-1 bg-black/40 text-white backdrop-blur">
      <Users className="size-3" /> Started by {username}
    </Badge>
  );
}
