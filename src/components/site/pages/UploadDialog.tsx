"use client";

import * as React from "react";
import { useStore, type MemoryCategory, type Visibility, type MemoryType } from "@/lib/store";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Upload, ChevronDown, ShieldCheck, Music } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES: { key: MemoryCategory; label: string }[] = [
  { key: "photos", label: "Photos" },
  { key: "videos", label: "Videos" },
  { key: "song-wise", label: "Song-wise memories" },
  { key: "special-moments", label: "Special moments" },
  { key: "audience", label: "Audience memories" },
  { key: "timeline", label: "Timeline-wise" },
  { key: "favourite", label: "Favourite moments" },
  { key: "highlights", label: "Concert highlights" },
];

export function UploadDialog({
  open,
  onOpenChange,
  concertId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  concertId?: string;
}) {
  const { auth, concerts, artists, addMemory } = useStore();
  const [type, setType] = React.useState<MemoryType>("photo");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string>("");
  const [caption, setCaption] = React.useState("");
  const [artistName, setArtistName] = React.useState("");
  const [concertName, setConcertName] = React.useState("");
  const [songName, setSongName] = React.useState("");
  const [category, setCategory] = React.useState<MemoryCategory>("photos");
  const [visibility, setVisibility] = React.useState<Visibility>("public");
  const [containsSpoilers, setContainsSpoilers] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);

  React.useEffect(() => {
    if (concertId) {
      const c = concerts.find((x) => x.id === concertId);
      if (c) {
        setConcertName(`${c.artist} — ${c.tour}`);
        setArtistName(c.artist);
      }
    }
  }, [concertId, concerts]);

  React.useEffect(() => {
    if (songName.trim()) {
      // suggesting spoiler tagging for song-wise content
      setContainsSpoilers(true);
    }
  }, [songName]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setType("photo");
    setFile(null);
    setPreview("");
    setCaption("");
    setSongName("");
    setCategory("photos");
    setVisibility("public");
    setContainsSpoilers(false);
    setAgreed(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast.error("Sign in to upload");
      return;
    }
    if (!caption.trim()) {
      toast.error("Add a caption");
      return;
    }
    if (!agreed) {
      toast.error("Please agree to the upload rules");
      return;
    }
    const targetConcert =
      concerts.find((c) => `${c.artist} — ${c.tour}` === concertName)?.id ??
      concerts.find((c) => c.id === concertId)?.id ??
      concerts[0]?.id ?? "";

    try {
      await addMemory({
        concertId: targetConcert,
        userId: auth.id,
        username: auth.username,
        type,
        url: preview,
        caption: caption.trim(),
        songName: songName.trim() || undefined,
        category,
        visibility,
        containsSpoilers,
        approved: visibility !== "public",
      }, file ?? undefined);
      toast.success(
        visibility === "public" ? "Sent for review" : "Memory saved",
        { description: visibility === "public" ? "Pending review before it's public." : "Visible to your chosen audience." }
      );
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this memory");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto scroll-soft sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload className="size-5 text-primary" /> Share a memory</DialogTitle>
          <DialogDescription>Only what you created. Be honest. Be kind.</DialogDescription>
        </DialogHeader>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <ShieldCheck className="size-4" /> Upload rules <ChevronDown className="size-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-lg border border-border/40 bg-card/40 p-3 text-xs text-muted-foreground">
            <ul className="list-disc space-y-1 pl-4">
              <li>I only upload content <strong>I created myself</strong>.</li>
              <li>No professional / official broadcast material.</li>
              <li>No leaking setlists or special moments without the spoiler tag.</li>
              <li>No faces of people who haven't agreed to be in the photo.</li>
              <li>Public uploads go through review before they appear in the library.</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as MemoryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MemoryCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file">File ({type})</Label>
            <Input id="file" type="file" accept={type === "photo" ? "image/*" : "video/*"} onChange={onFile} required />
            {preview && (
              <div className="mt-2 overflow-hidden rounded-lg border border-border/40">
                {type === "photo" ? (
                  <img src={preview} alt="preview" className="max-h-40 w-full object-cover" />
                ) : (
                  <video src={preview} className="max-h-40 w-full" controls />
                )}
              </div>
            )}
            {!preview && (
              <p className="text-[10px] text-muted-foreground">Object URLs are used for preview — they won't survive a reload.</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="artist">Artist</Label>
              <Input id="artist" list="artist-list" value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Lumina Sky" />
              <datalist id="artist-list">
                {artists.map((a) => <option key={a.id} value={a.name} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="concert">Concert</Label>
              <Input id="concert" list="concert-list" value={concertName} onChange={(e) => setConcertName(e.target.value)} placeholder="Tour — City" />
              <datalist id="concert-list">
                {concerts.map((c) => <option key={c.id} value={`${c.artist} — ${c.tour}`} />)}
              </datalist>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="caption">Caption</Label>
            <Textarea id="caption" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="What happened? How did it feel?" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="song">Song name (optional)</Label>
            <div className="flex items-center gap-2">
              <Music className="size-4 text-muted-foreground" />
              <Input id="song" value={songName} onChange={(e) => setSongName(e.target.value)} placeholder="The song playing in this moment" />
            </div>
            {songName && (
              <Badge variant="secondary" className="text-[10px]">Tagged song — spoiler tagging suggested</Badge>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Visibility</Label>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as Visibility)} className="grid gap-1.5 sm:grid-cols-3">
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/40 p-2 text-xs">
                <RadioGroupItem value="public" id="v-pub" />
                <div><p className="font-medium">Public</p><p className="text-muted-foreground">Goes to review first.</p></div>
              </label>
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/40 p-2 text-xs">
                <RadioGroupItem value="connections" id="v-con" />
                <div><p className="font-medium">Connections</p><p className="text-muted-foreground">Only your crowd.</p></div>
              </label>
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/40 p-2 text-xs">
                <RadioGroupItem value="private" id="v-priv" />
                <div><p className="font-medium">Private</p><p className="text-muted-foreground">Just for you.</p></div>
              </label>
            </RadioGroup>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/40 p-2 text-sm">
            <Checkbox checked={containsSpoilers} onCheckedChange={(v) => setContainsSpoilers(Boolean(v))} />
            Contains spoilers (setlist / special moment)
          </label>

          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2 text-xs">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(Boolean(v))} />
            <span>I only upload content I created. No professional/official broadcast material.</span>
          </label>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!agreed}>Submit memory</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
