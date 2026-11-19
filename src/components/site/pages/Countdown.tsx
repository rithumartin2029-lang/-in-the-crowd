"use client";

import * as React from "react";
import { useStore, type CountdownItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/site/EmptyState";
import { Section } from "@/components/site/Section";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCountdown, coverClass, formatConcertDate } from "@/lib/utils";
import { Plus, Trash2, Share2, Sparkles, Image as ImageIcon, Heart } from "lucide-react";
import { toast } from "sonner";

// Structure ready for Android/iOS home-screen widget integration later.
export default function Countdown() {
  const { auth, countdowns, addCountdown, deleteCountdown, navigate, memories, registeredUsers, connections, shareCountdown } = useStore();
  const [open, setOpen] = React.useState(false);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [sharingId, setSharingId] = React.useState<string | null>(null);
  const [shareSelection, setShareSelection] = React.useState<string[]>([]);
  // Keep the selector result stable: Zustand subscriptions must not return a new array on every snapshot.
  const userMemories = React.useMemo(
    () => memories.filter((memory) => memory.userId === auth?.id && memory.type === "photo"),
    [memories, auth?.id]
  );
  const shareablePeople = React.useMemo(() => {
    const ids = new Set([
      ...connections.fomo.filter((link) => link.status === "accepted").map((link) => link.userId),
      ...connections.buddies.filter((link) => link.status === "accepted").map((link) => link.userId),
    ]);
    return registeredUsers.filter((user) => ids.has(user.id) && user.id !== auth?.id);
  }, [connections, registeredUsers, auth?.id]);
  const [form, setForm] = React.useState<Omit<CountdownItem, "id">>({
    artist: "",
    concert: "",
    date: "",
    venue: "",
    city: "",
    notes: "",
    imageUrl: "",
    variant: "minimal",
    sharedWith: [],
  });

  if (!auth) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.artist.trim() || !form.concert.trim() || !form.date) {
      toast.error("Add artist, concert, and date");
      return;
    }
    setSaving(true);
    try {
      await addCountdown(form, photoFile ?? undefined);
      setForm({ artist: "", concert: "", date: "", venue: "", city: "", notes: "", imageUrl: "", variant: "minimal", sharedWith: [] });
      setPhotoFile(null);
      setPhotoPreview("");
      setOpen(false);
      toast.success("Countdown added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save countdown");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <Section
        title="My Countdowns"
        description="Live ticking. The days, hours, minutes, seconds between you and the show."
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
                  <div className="space-y-1.5"><Label>Artist *</Label><Input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Concert *</Label><Input value={form.concert} onChange={(e) => setForm({ ...form, concert: e.target.value })} /></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5"><Label>Date *</Label><Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                </div>
                <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Countdown photo</Label>
                  <Input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setPhotoFile(file);
                    setForm((current) => ({ ...current, imageUrl: "" }));
                    setPhotoPreview(file ? URL.createObjectURL(file) : "");
                  }} />
                  {userMemories.length > 0 && (
                    <div className="space-y-1.5">
                      <Label>Or choose one of your existing memories</Label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={photoFile ? "" : form.imageUrl}
                        onChange={(e) => {
                          const selected = userMemories.find((memory) => memory.storagePath === e.target.value);
                          setPhotoFile(null);
                          setPhotoPreview(selected?.url ?? "");
                          setForm((current) => ({ ...current, imageUrl: e.target.value }));
                        }}
                      >
                        <option value="">No saved memory selected</option>
                        {userMemories.filter((memory) => memory.storagePath).map((memory) => (
                          <option key={memory.id} value={memory.storagePath!}>{memory.caption || "Saved photo"}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {(photoPreview || form.imageUrl) && (
                    <img src={photoPreview || userMemories.find((memory) => memory.storagePath === form.imageUrl)?.url || ""} alt="Countdown photo preview" className="h-36 w-full rounded-lg object-cover" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Card variant</Label>
                  <ToggleGroup type="single" value={form.variant} onValueChange={(v) => v && setForm({ ...form, variant: v as CountdownItem["variant"] })}>
                    <ToggleGroupItem value="minimal">Minimal</ToggleGroupItem>
                    <ToggleGroupItem value="artist-photo">Artist photo</ToggleGroupItem>
                    <ToggleGroupItem value="concert-info">Concert info</ToggleGroupItem>
                    <ToggleGroupItem value="personal-card">Personal card</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add countdown"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {sharingId && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="space-y-3 p-4">
              <div>
                <p className="font-medium">Share this countdown</p>
                <p className="text-xs text-muted-foreground">Only the people you select can see it. Sharing is separate from FOMO and Concert Buddy status.</p>
              </div>
              {shareablePeople.length === 0 ? (
                <EmptyState title="No accepted connections yet" message="Add a FOMO Buddy or Concert Buddy first. Your countdown stays private until then." />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {shareablePeople.map((person) => (
                    <label key={person.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/40 bg-background/60 p-2 text-sm">
                      <input
                        type="checkbox"
                        checked={shareSelection.includes(person.id)}
                        onChange={(e) => setShareSelection((current) => e.target.checked ? [...current, person.id] : current.filter((id) => id !== person.id))}
                        className="size-4 accent-primary"
                      />
                      <span className="truncate">{person.username}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setSharingId(null)}>Cancel</Button>
                <Button size="sm" disabled={false} onClick={async () => {
                  const ok = await shareCountdown(sharingId, shareSelection);
                  if (ok) {
                    toast.success(shareSelection.length ? "Countdown shared with selected connections" : "Countdown is private again");
                    setSharingId(null);
                  } else toast.error("Could not update countdown sharing");
                }}>Save sharing</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {countdowns.length === 0 ? (
          <EmptyState title="No countdowns yet" message="Add one and watch the days tick." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {countdowns.map((c) => {
              const isOwner = !c.ownerId || c.ownerId === auth.id;
              const sharedNames = (c.sharedWith ?? []).map((id) => registeredUsers.find((user) => user.id === id)?.username).filter(Boolean) as string[];
              return (
                <CountdownCard
                  key={c.id}
                  c={c}
                  isOwner={isOwner}
                  sharedNames={sharedNames}
                  onDelete={() => { deleteCountdown(c.id); toast.success("Deleted"); }}
                  onShare={() => { setSharingId(c.id); setShareSelection(c.sharedWith ?? []); }}
                  onUpload={() => navigate("explore")}
                />
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

function CountdownCard({ c, isOwner, sharedNames, onDelete, onShare, onUpload }: { c: CountdownItem; isOwner: boolean; sharedNames: string[]; onDelete: () => void; onShare: () => void; onUpload: () => void }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const t = formatCountdown(new Date(c.date).getTime() - now + now);
  void t;
  const remaining = new Date(c.date).getTime() - now;
  const done = remaining <= 0;
  const days = Math.max(0, Math.floor(remaining / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const mins = Math.max(0, Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)));
  const secs = Math.max(0, Math.floor((remaining % (1000 * 60)) / 1000));

  return (
    <Card className={`overflow-hidden ${c.variant === "artist-photo" ? "" : ""}`}>
      {(c.imageUrl || c.variant === "artist-photo") && (
        <div className={`relative h-36 ${c.imageUrl ? "" : coverClass(1)}`}>
          {c.imageUrl && <img src={c.imageUrl} alt={`${c.artist} countdown`} className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <p className="absolute bottom-2 left-3 text-sm font-bold text-white">{c.artist}</p>
        </div>
      )}
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{c.artist}</p>
            <p className="text-xs text-muted-foreground">{c.concert}</p>
            {c.venue && <p className="text-xs text-muted-foreground">{c.venue}, {c.city}</p>}
            <p className="text-[10px] text-muted-foreground">{formatConcertDate(c.date)}</p>
            {!isOwner && <p className="mt-1 text-[10px] text-primary">Shared by {c.ownerUsername || "a crowd member"}</p>}
          </div>
          <Badge variant="secondary" className="capitalize">{c.variant}</Badge>
        </div>

        {done ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-center">
            <p className="text-xl font-bold text-primary">I WAS THERE!</p>
            <Button size="sm" className="mt-2 gap-1.5" onClick={onUpload}><ImageIcon className="size-4" /> Upload a memory</Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1 text-center">
            <Stat n={days} l="days" />
            <Stat n={hours} l="hrs" />
            <Stat n={mins} l="min" />
            <Stat n={secs} l="sec" />
          </div>
        )}

        {c.notes && <p className="text-xs italic text-muted-foreground line-clamp-2">{c.notes}</p>}

        {isOwner && (
          <>
            {sharedNames.length > 0 && <p className="text-[10px] text-muted-foreground">Shared with: {sharedNames.join(", ")}</p>}
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={onShare} className="gap-1.5"><Share2 className="size-3.5" /> Share</Button>
              <Button size="sm" variant="ghost" onClick={onDelete} className="ml-auto gap-1.5 text-destructive"><Trash2 className="size-3.5" /> Delete</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-md bg-muted/40 py-1.5">
      <p className="text-base font-bold tabular-nums text-primary">{String(n).padStart(2, "0")}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</p>
    </div>
  );
}
