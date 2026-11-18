"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function AddBucketSheet() {
  const { addBucketItem } = useStore();
  const [open, setOpen] = React.useState(false);
  const [artist, setArtist] = React.useState("");
  const [concert, setConcert] = React.useState("");
  const [tour, setTour] = React.useState("");
  const [date, setDate] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [city, setCity] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist.trim() || !concert.trim()) {
      toast.error("Add at least artist and concert");
      return;
    }
    addBucketItem({
      artist: artist.trim(),
      concert: concert.trim(),
      tour: tour.trim() || undefined,
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="w-full gap-1.5"><Plus className="size-4" /> Add a dream</Button>
      </SheetTrigger>
      <SheetContent className="scroll-soft overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add to bucket list</SheetTitle>
          <SheetDescription>Concerts you dream of seeing one day.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="space-y-3 p-2">
          <div className="space-y-1.5"><Label>Artist *</Label><Input value={artist} onChange={(e) => setArtist(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Concert / tour *</Label><Input value={concert} onChange={(e) => setConcert(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Tour name</Label><Input value={tour} onChange={(e) => setTour(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Venue</Label><Input value={venue} onChange={(e) => setVenue(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <SheetFooter><Button type="submit">Add</Button></SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
