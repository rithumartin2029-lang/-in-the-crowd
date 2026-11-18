"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { ConcertCard } from "@/components/site/ConcertCard";
import { Section } from "@/components/site/Section";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/site/EmptyState";
import { coverClass, softCount } from "@/lib/utils";
import { Search, Users, Plus } from "lucide-react";
import { StartSpaceButton } from "@/components/site/StartSpaceDialog";

export default function Explore() {
  const { concerts, artists, navigate, gentleMode, auth } = useStore();
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "upcoming" | "completed" | "libraries" | "memories">("all");

  const filtered = concerts.filter((c) => {
    if (filter === "upcoming" && c.past) return false;
    if (filter === "completed" && !c.past) return false;
    if (filter === "libraries" && c.libraryCount.photos + c.libraryCount.videos === 0) return false;
    if (filter === "memories" && c.libraryCount.photos === 0) return false;
    if (q.trim()) {
      const s = `${c.artist} ${c.tour} ${c.city} ${c.venue}`.toLowerCase();
      if (!s.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const filteredArtists = artists.filter((a) =>
    q.trim() ? `${a.name} ${a.genre}`.toLowerCase().includes(q.toLowerCase()) : true
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <Section title="Explore the crowd" description="Concerts, libraries, artists, memories — all in one place.">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by artist, tour, venue, or city..." className="pl-9" />
          </div>
          {auth && <StartSpaceButton label="Start a space" size="sm" variant="secondary" />}
          {!auth && (
            <Button size="sm" variant="secondary" onClick={() => navigate("auth")} className="gap-1.5">
              <Plus className="size-4" /> Start a space
            </Button>
          )}
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="libraries">Libraries</TabsTrigger>
            <TabsTrigger value="memories">Memories</TabsTrigger>
          </TabsList>
        </Tabs>
      </Section>

      <Section title="Artist collections" description={artists.length === 0 ? "Artist communities appear here when someone starts a space." : "Tap an artist to join their community."}>
        {filteredArtists.length === 0 ? (
          <EmptyState title="No artists match" message={artists.length === 0 ? "Start a space — the artist gets a community page automatically." : "Try a different search."} />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scroll-soft">
            {filteredArtists.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate("artist-community", { artistId: a.id })}
                className="flex min-w-[200px] flex-col overflow-hidden rounded-xl border border-border/60 bg-card/60 text-left"
              >
                <div className={`relative h-20 ${coverClass(a.coverIndex)}`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <p className="absolute bottom-2 left-3 font-bold text-white">{a.name}</p>
                </div>
                <div className="flex items-center justify-between p-2 text-xs">
                  <span className="text-muted-foreground">{a.genre || "Community"}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Users className="size-3" /> {softCount(a.members * 17, gentleMode)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section title={`${filtered.length} concert${filtered.length === 1 ? "" : "s"}`}>
        {filtered.length === 0 ? (
          concerts.length === 0 ? (
            <EmptyState
              title="No concerts yet"
              message={auth ? "Be the first. Start a space for a concert you went to, missed, or dream of — others can find it and join." : "Sign in to start one, or check back once people add them."}
            />
          ) : (
            <EmptyState title="No concerts found" message="Try clearing the search or switching filters." />
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((c) => (
              <ConcertCard key={c.id} concert={c} />
            ))}
          </div>
        )}
      </Section>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Tip</Badge>
        <span className="text-sm text-muted-foreground">User-added spaces are marked “Added by a fan”. Tapping a card opens its full page with chat room and library.</span>
      </div>
    </div>
  );
}
