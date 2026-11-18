"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ConcertCard } from "@/components/site/ConcertCard";
import { Library } from "./Library";
import { EmptyState } from "@/components/site/EmptyState";
import { Together } from "./Together";
import { coverClass, formatConcertDate, softCount } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Shield,
  Eye,
  Users,
  Sparkles,
  Plus,
  Heart,
  ChevronLeft,
  Check,
  UserPlus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { StartedByBadge } from "@/components/site/StartSpaceDialog";

export default function ConcertDetail() {
  const {
    concerts,
    selectedConcertId,
    navigate,
    toggleSpoilerShield,
    spoilerShields,
    auth,
    addBucketItem,
    memories,
    gentleMode,
    sendConnectionRequest,
    joinConcert,
    leaveConcert,
    deleteConcert,
  } = useStore();

  const concert = concerts.find((c) => c.id === selectedConcertId);

  if (!concert) {
    return (
      <div className="px-4 py-10">
        <EmptyState title="No concert selected" message="Pick one from Explore." />
        <Button variant="ghost" className="mt-3" onClick={() => navigate("explore")}>Back to Explore</Button>
      </div>
    );
  }

  const shielded = spoilerShields.includes(concert.id);
  const memCount = memories.filter((m) => m.concertId === concert.id && m.visibility === "public" && m.approved).length;
  const inBucket = auth ? false : false; // simplified
  const joined = !!auth && auth.joinedConcertIds.includes(concert.id);
  const isHost = !!auth && concert.createdById === auth.id;
  const canDelete = !!auth && (isHost || auth.role === "admin");

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("explore")} className="gap-1">
        <ChevronLeft className="size-4" /> Back to Explore
      </Button>

      {/* HEADER */}
      <div className={`relative overflow-hidden rounded-2xl ${coverClass(concert.coverIndex)}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative flex flex-col gap-4 p-6 sm:p-10">
          <div className="flex flex-wrap gap-2">
            {concert.unverified && <Badge className="bg-black/40 text-white backdrop-blur">Added by a fan</Badge>}
            {concert.past ? (
              <Badge className="bg-black/40 text-white backdrop-blur">Past show</Badge>
            ) : (
              <Badge className="bg-primary/30 text-white backdrop-blur">Upcoming</Badge>
            )}
            {shielded && <Badge className="bg-accent/40 text-white backdrop-blur"><Shield className="size-3" /> Shielded</Badge>}
            {concert.createdByUsername && (
              <StartedByBadge username={concert.createdByUsername} />
            )}
            {joined && (
              <Badge className="bg-primary/30 text-white backdrop-blur"><Check className="size-3" /> Joined</Badge>
            )}
          </div>
          <div className="text-white">
            <p className="text-sm uppercase tracking-[0.18em] opacity-80">{concert.tour}</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{concert.artist}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm opacity-90">
              <span className="flex items-center gap-1.5"><Calendar className="size-4" /> {formatConcertDate(concert.date)}</span>
              {concert.venue && <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {concert.venue}{concert.city ? `, ${concert.city}` : ""}</span>}
              {!concert.venue && concert.city && <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {concert.city}</span>}
              <span className="flex items-center gap-1.5"><Users className="size-4" /> {softCount(memCount, gentleMode)}</span>
            </div>
            {concert.notes && (
              <p className="mt-3 max-w-xl text-sm opacity-90 italic">“{concert.notes}”</p>
            )}
          </div>
        </div>
      </div>

      {/* SIDEBAR ACTIONS */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="library">Memory Library</TabsTrigger>
              <TabsTrigger value="together">Together Room</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card className="bg-card/60">
                <CardContent className="space-y-3 p-5 text-sm">
                  <p>
                    This is the page for <strong>{concert.artist}</strong> — <em>{concert.tour}</em>.
                    Whether you were here, missed it, or are still hoping to go, you belong on this page.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Stat label="Photos" value={gentleMode ? "Many" : String(concert.libraryCount.photos)} />
                    <Stat label="Videos" value={gentleMode ? "Many" : String(concert.libraryCount.videos)} />
                    <Stat label="Song-wise" value={gentleMode ? "Many" : String(concert.libraryCount.songWise)} />
                  </div>
                  {concert.unverified && (
                    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
                      This space was <strong>added by a fan</strong> — details may not be official. Add your own memories or chat in the room below.
                    </p>
                  )}
                  {concert.past && (
                    <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                      <p className="text-sm font-medium">Were you there?</p>
                      <p className="text-xs text-muted-foreground">Mark yourself as attended to unlock "I WAS THERE" and add your memories.</p>
                      <Button size="sm" className="mt-2" onClick={() => {
                        if (!auth) { navigate("auth", undefined); return; }
                        toast.success("Marked as attended", { description: "Welcome to the night." });
                      }}>
                        <Heart className="size-4" /> I WAS THERE
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/40">
                <CardContent className="p-5">
                  <p className="text-sm font-medium">Other concerts by {concert.artist}</p>
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scroll-soft">
                    {concerts.filter((c) => c.artist === concert.artist && c.id !== concert.id).map((c) => (
                      <div key={c.id} className="min-w-[220px] max-w-[220px]">
                        <ConcertCard concert={c} compact />
                      </div>
                    ))}
                    {concerts.filter((c) => c.artist === concert.artist && c.id !== concert.id).length === 0 && (
                      <p className="text-sm text-muted-foreground">No other concerts yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="library" className="mt-4">
              <Library concertId={concert.id} />
            </TabsContent>

            <TabsContent value="together" className="mt-4">
              <Together concertId={concert.id} embedded />
            </TabsContent>
          </Tabs>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-3">
          <Card className="bg-card/60">
            <CardContent className="space-y-3 p-4">
              <div>
                <p className="text-sm font-medium">Join this space</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Joining adds it to “Spaces I joined” so you can find the chat room, library and updates quickly.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {joined ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => { leaveConcert(concert.id); toast.success("Left the space", { description: "You can rejoin any time." }); }}
                    >
                      <Check className="size-4" /> Joined — leave
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        if (!auth) { navigate("auth"); return; }
                        joinConcert(concert.id);
                        toast.success("Joined the space", { description: "Welcome to the night." });
                      }}
                    >
                      <UserPlus className="size-4" /> Join space
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive"
                      onClick={() => {
                        if (!confirm("Delete this space? Memories and chat will be removed too.")) return;
                        deleteConcert(concert.id);
                        toast.success("Space deleted");
                        navigate("explore");
                      }}
                    >
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60">
            <CardContent className="space-y-3 p-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium"><Shield className="size-4 text-primary" /> Spoiler Shield</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hide setlists, song-wise memories and special moments for this concert.
                </p>
                <Button
                  size="sm"
                  variant={shielded ? "default" : "outline"}
                  className="mt-2 w-full gap-1.5"
                  onClick={() => {
                    toggleSpoilerShield(concert.id);
                    toast(shielded ? "Spoiler shield off" : "Spoilers shielded", {
                      description: shielded ? "Setlists visible again." : "Tap any blurred item to reveal it.",
                    });
                  }}
                >
                  <Eye className="size-4" />
                  {shielded ? "Shielded — tap to unshield" : "Shield this concert"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60">
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-medium">Quick actions</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => {
                  if (!auth) { navigate("auth"); return; }
                  addBucketItem({
                    artist: concert.artist,
                    concert: concert.tour,
                    tour: concert.tour,
                    date: concert.date,
                    venue: concert.venue,
                    city: concert.city,
                    notes: "",
                  });
                  toast.success("Added to bucket list");
                }}
              >
                <Plus className="size-4" /> Add to bucket list
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => {
                  if (!auth) { navigate("auth"); return; }
                  navigate("countdown");
                  toast.success("Add a countdown from Countdown page");
                }}
              >
                <Sparkles className="size-4" /> Add a countdown
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full gap-1.5"
                onClick={() => {
                  if (!auth) { navigate("auth"); return; }
                  sendConnectionRequest("concert-" + concert.id);
                  toast.success("Looking for buddies", { description: "We'll let you know when someone matches." });
                }}
              >
                <Users className="size-4" /> Find buddies for this concert
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/40">
            <CardContent className="p-4 text-xs text-muted-foreground">
              <p>Be kind. Don't spoil. Tap the shield to hide special moments until you're ready.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-center">
      <p className="text-lg font-bold text-primary">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
