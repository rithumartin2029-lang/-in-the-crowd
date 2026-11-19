"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Library } from "./Library";
import { Section } from "@/components/site/Section";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Images, Compass } from "lucide-react";

export default function CrowdMemories() {
  const { concerts, selectedConcertId, navigate } = useStore();
  const [concertId, setConcertId] = React.useState(selectedConcertId ?? concerts[0]?.id ?? "");
  React.useEffect(() => {
    if (!concertId && concerts.length) setConcertId(concerts[0].id);
  }, [concertId, concerts]);
  const selected = concerts.find((concert) => concert.id === concertId);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <Section title="Crowd Memories" description="The photos, videos, songs and little details that make a concert unforgettable.">{null}</Section>
      {concerts.length === 0 ? <><EmptyState title="Your memory wall is waiting" message="Find or start a concert space first. Every concert has its own memory library." /><div className="flex justify-center"><Button onClick={() => navigate("explore")}><Compass className="mr-2 size-4" /> Explore concerts</Button></div></>
      : <>
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2"><Images className="size-5 text-primary" /><div><p className="text-sm font-semibold">Choose a concert</p><p className="text-xs text-muted-foreground">Browse its shared memory collection or add your own.</p></div></div>
          <select value={concertId} onChange={(e) => setConcertId(e.target.value)} className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm sm:max-w-sm">
            {concerts.map((concert) => <option key={concert.id} value={concert.id}>{concert.artist} · {concert.tour}</option>)}
          </select>
        </div>
        {selected ? <Library concertId={selected.id} /> : null}
      </>}
    </div>
  );
}
