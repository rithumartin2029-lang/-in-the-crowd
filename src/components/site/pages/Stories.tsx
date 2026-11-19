"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/site/EmptyState";
import { Section } from "@/components/site/Section";
import { Badge } from "@/components/ui/badge";
import { Clock3, Plus, X, ChevronLeft, ChevronRight, Flag, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Story = {
  id: string; user_id: string; username: string; media_type: "image" | "video";
  storage_path: string; caption: string; visibility: "public" | "connections" | "private";
  created_at: string; expires_at: string; url: string;
};

export default function Stories() {
  const { auth, reportContent, navigate } = useStore();
  const [stories, setStories] = React.useState<Story[]>([]);
  const [file, setFile] = React.useState<File | null>(null);
  const [caption, setCaption] = React.useState("");
  const [visibility, setVisibility] = React.useState<Story["visibility"]>("connections");
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [activeGroup, setActiveGroup] = React.useState<Story[] | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const loadStories = React.useCallback(async () => {
    if (!supabase || !auth) { setStories([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("stories").select("*")
      .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false });
    if (error) { toast.error("Stories couldn't load. Please try again."); setLoading(false); return; }
    const rows = await Promise.all((data ?? []).map(async (row: any) => {
      const { data: signed } = await supabase!.storage.from("memories").createSignedUrl(row.storage_path, 3600);
      return { ...row, url: signed?.signedUrl ?? "" } as Story;
    }));
    setStories(rows.filter((s) => s.url));
    setLoading(false);
  }, [auth?.id]);

  React.useEffect(() => { void loadStories(); }, [loadStories]);

  const uploadStory = async () => {
    if (!auth) { navigate("auth"); return; }
    if (!supabase) { toast.error("Stories need a live account connection."); return; }
    if (!file) { toast.error("Choose a photo or video first."); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error("Please choose a file smaller than 50 MB."); return; }
    setUploading(true);
    const extension = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : (file.type.split("/")[1] || "bin");
    const path = `${auth.id}/stories/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("memories").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { toast.error(uploadError.message); setUploading(false); return; }
    const { error } = await supabase.from("stories").insert({
      user_id: auth.id, username: auth.username, media_type: file.type.startsWith("video/") ? "video" : "image",
      storage_path: path, caption: caption.trim(), visibility,
    });
    if (error) {
      await supabase.storage.from("memories").remove([path]);
      toast.error("Your story couldn't be posted. Please try again.");
      setUploading(false); return;
    }
    setFile(null); setCaption(""); setUploading(false);
    toast.success("Your story is up for the next 24 hours.");
    await loadStories();
  };

  const groups = React.useMemo(() => {
    const map = new Map<string, Story[]>();
    for (const story of stories) map.set(story.user_id, [...(map.get(story.user_id) ?? []), story]);
    return [...map.values()];
  }, [stories]);
  const activeStory = activeGroup?.[activeIndex];

  const closeViewer = () => { setActiveGroup(null); setActiveIndex(0); };
  const removeStory = async (story: Story) => {
    if (!supabase || story.user_id !== auth?.id) return;
    const { error } = await supabase.from("stories").delete().eq("id", story.id);
    if (error) { toast.error("Couldn't delete that story."); return; }
    await supabase.storage.from("memories").remove([story.storage_path]);
    closeViewer(); await loadStories(); toast.success("Story deleted.");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <Section title="Crowd Stories" description="Little moments from the crowd. Every story disappears after 24 hours." />
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card/80 to-accent/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-primary" /> Add to the moment</CardTitle>
          <CardDescription>Share one photo or video. Your audience is shown before you post.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input type="file" accept="image/*,video/mp4,video/webm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-2 file:text-primary" />
          {file && <p className="text-xs text-muted-foreground">Selected: {file.name}</p>}
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={180} placeholder="Add a little caption (optional)..." className="min-h-20 w-full rounded-lg border border-input bg-background/70 p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Who can see it?</span>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value as Story["visibility"])} className="rounded-md border border-input bg-background px-2 py-2 text-sm">
                <option value="connections">Accepted connections</option><option value="public">Everyone signed in</option><option value="private">Only me</option>
              </select>
            </label>
            <Button onClick={() => void uploadStory()} disabled={uploading || !file} className="gap-2"><Plus className="size-4" /> {uploading ? "Posting..." : "Share story"}</Button>
          </div>
          <p className="text-xs text-muted-foreground">Stories are private to your chosen audience. Keep uploads under 50 MB.</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">The crowd right now</h2><Badge variant="secondary"><Clock3 className="mr-1 size-3" /> 24-hour stories</Badge></div>
        {loading ? <div className="rounded-xl border border-border/50 p-8 text-center text-sm text-muted-foreground">Loading stories…</div>
          : groups.length === 0 ? <EmptyState title="The story starts with you" message="Post a photo or short video, or come back when your crowd shares a moment." />
          : <div className="flex gap-4 overflow-x-auto pb-3">
              {groups.map((group) => <button key={group[0].user_id} onClick={() => { setActiveGroup(group); setActiveIndex(0); }} className="flex w-20 shrink-0 flex-col items-center gap-2 text-center">
                <span className="grid size-[68px] place-items-center rounded-full bg-gradient-to-br from-primary via-accent to-primary p-[3px]"><span className="grid size-full place-items-center rounded-full border-2 border-background bg-card text-lg font-bold">{group[0].username.slice(0,2).toUpperCase()}</span></span>
                <span className="w-full truncate text-xs font-medium">{group[0].user_id === auth?.id ? "Your story" : group[0].username}</span>
              </button>)}
            </div>}
      </div>

      {activeStory && activeGroup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-3" role="dialog" aria-modal="true" aria-label="Story viewer">
          <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/15 bg-card shadow-2xl">
            <div className="flex items-center justify-between gap-2 p-3">
              <div><p className="text-sm font-semibold">{activeStory.username}</p><p className="text-xs text-muted-foreground">Ends {new Date(activeStory.expires_at).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</p></div>
              <Button size="icon" variant="ghost" onClick={closeViewer} aria-label="Close story"><X className="size-4" /></Button>
            </div>
            <div className="relative flex min-h-64 items-center justify-center bg-black">
              {activeStory.media_type === "video" ? <video src={activeStory.url} controls autoPlay playsInline className="max-h-[65vh] w-full object-contain" /> : <img src={activeStory.url} alt={activeStory.caption || "Crowd story"} className="max-h-[65vh] w-full object-contain" />}
              {activeGroup.length > 1 && <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2"><Button size="icon" variant="secondary" onClick={() => setActiveIndex((i) => (i + activeGroup.length - 1) % activeGroup.length)} aria-label="Previous story"><ChevronLeft /></Button><Button size="icon" variant="secondary" onClick={() => setActiveIndex((i) => (i + 1) % activeGroup.length)} aria-label="Next story"><ChevronRight /></Button></div>}
            </div>
            <div className="space-y-3 p-4"><p className="text-sm">{activeStory.caption || "A moment from the crowd."}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{activeIndex + 1} of {activeGroup.length}</span>
                {activeStory.user_id === auth?.id ? <Button size="sm" variant="destructive" onClick={() => void removeStory(activeStory)}><Trash2 className="mr-1 size-3.5" /> Delete</Button> : <Button size="sm" variant="ghost" onClick={() => { void reportContent({reporterId:auth?.id ?? "anon",targetType:"story",targetId:activeStory.id,reason:"Reported from Crowd Stories"}); toast.success("Story reported for review."); }}><Flag className="mr-1 size-3.5" /> Report</Button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
