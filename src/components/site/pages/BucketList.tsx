"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/site/EmptyState";
import { Section } from "@/components/site/Section";
import { formatCountdown, coverClass, formatConcertDate } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Trash2, Share2, Sparkles, Image as ImageIcon } from "lucide-react";

export default function BucketList() {
  const { auth, bucketList, addBucketItem, markBucketAttended, navigate } = useStore();
  const [open, setOpen] = React.useState(false);
  const [artist, setArtist] = React.useState("");
  const [concert, setConcert] = React.useState("");
  const [tour, setTour] = React.useState("");
  const [date, setDate] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [city, setCity] = React.useState("");
  const [notes, setNotes] = React.useState("");

  if (!auth) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist.trim() || !concert.trim()) { toast.error("Add at least artist and concert"); return; }
    addBucketItem({
      artist: artist.trim(),
      concert: concert.trim(),
      tour: tour || undefined,
      date: date || undefined,
      venue: venue || undefined,
      city: city || undefined,
      notes: notes || undefined,
    });
    setArtist(""); setConcert(""); setTour(""); setDate(""); setVenue(""); setCity(""); setNotes("");
    setOpen(false);
    toast.success("Added to your bucket list");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <Section
        title="My Bucket List"
        description="Concerts you dream of seeing one day. Private by default."
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)} className="gap-1.5">
            <Plus className="size-4" /> Add
          </Button>
        }
      >
        {open && (
          <Card className="bg-card/60">
            <CardContent>
              <form onSubmit={submit} className="space-y-3 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label>Artist *</Label><Input value={artist} onChange={(e) => setArtist(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Concert / tour *</Label><Input value={concert} onChange={(e) => setConcert(e.target.value)} /></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5"><Label>Tour name</Label><Input value={tour} onChange={(e) => setTour(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                </div>
                <div className="space-y-1.5"><Label>Venue</Label><Input value={venue} onChange={(e) => setVenue(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Add to list</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {bucketList.length === 0 ? (
          <EmptyState title="Your bucket list is empty" message="Add the concerts you dream of seeing one day." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {bucketList.map((b) => (
              <Card key={b.id} className="bg-card/60">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{b.artist}</p>
                      <p className="text-xs text-muted-foreground">{b.concert}</p>
                    </div>
                    <Badge variant={b.attended ? "default" : "secondary"}>{b.attended ? "Was there" : "Dreaming"}</Badge>
                  </div>
                  {(b.date || b.venue || b.city) && (
                    <p className="text-xs text-muted-foreground">
                      {b.date && formatConcertDate(b.date)}{b.venue && ` · ${b.venue}`}{b.city && `, ${b.city}`}
                    </p>
                  )}
                  {b.notes && <p className="text-xs italic text-muted-foreground line-clamp-2">{b.notes}</p>}
                  {!b.attended ? (
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full gap-1.5"
                      onClick={() => {
                        markBucketAttended(b.id);
                        toast.success("You were there!", { description: "Write your first memory?" });
                      }}
                    >
                      <Sparkles className="size-4" /> Mark attended
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => navigate("explore")}>
                      <ImageIcon className="size-4" /> Write your first memory
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={() => toast.success("Shared with connections")} className="gap-1.5">
          <Share2 className="size-4" /> Share with connections
        </Button>
      </div>
    </div>
  );
}
