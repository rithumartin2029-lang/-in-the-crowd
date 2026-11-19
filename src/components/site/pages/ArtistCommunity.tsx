"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConcertCard } from "@/components/site/ConcertCard";
import { Section } from "@/components/site/Section";
import { EmptyState } from "@/components/site/EmptyState";
import { coverClass, timeAgo, avatarGradient, avatarInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Music, Send, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface Post { id: string; userId: string; username: string; body: string; createdAt: string; comments: { id: string; userId: string; username: string; body: string }[] }

export default function ArtistCommunity() {
  const { artists, selectedArtistId, concerts, navigate, auth } = useStore();
  const artist = artists.find((a) => a.id === selectedArtistId);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [body, setBody] = React.useState("");
  const [isMember, setIsMember] = React.useState(false);
  const [memberCount, setMemberCount] = React.useState(artist?.members ?? 0);
  const [membershipLoading, setMembershipLoading] = React.useState(false);

  React.useEffect(() => {
    setMemberCount(artist?.members ?? 0);
  }, [artist?.id, artist?.members]);

  React.useEffect(() => {
    let cancelled = false;
    async function loadMembership() {
      if (!artist || !auth || !supabase) {
        setIsMember(false);
        return;
      }
      const { data, error } = await supabase
        .from("artist_memberships")
        .select("artist_id")
        .eq("artist_id", artist.id)
        .eq("user_id", auth.id)
        .maybeSingle();
      if (!cancelled) {
        if (error) {
          toast.error("Couldn't check your membership. Please refresh.");
          setIsMember(false);
        } else {
          setIsMember(!!data);
        }
      }
    }
    void loadMembership();
    return () => { cancelled = true; };
  }, [artist?.id, auth?.id]);

  if (!artist) {
    return (
      <div className="px-4 py-10">
        <EmptyState title="No artist selected" message="Pick one from Explore." />
      </div>
    );
  }

  const artistConcerts = concerts.filter((c) => c.artist === artist.name);

  const toggleMembership = async () => {
    if (!auth) { navigate("auth"); return; }
    if (!supabase) {
      toast.error("Joining artist communities requires a live connection. Please try again later.");
      return;
    }
    setMembershipLoading(true);
    const result = isMember
      ? await supabase.from("artist_memberships").delete().eq("artist_id", artist.id).eq("user_id", auth.id)
      : await supabase.from("artist_memberships").insert({ artist_id: artist.id, user_id: auth.id });
    if (result.error) {
      toast.error(isMember ? "Couldn't leave this community. Please try again." : "Couldn't join this community. Please try again.");
      setMembershipLoading(false);
      return;
    }
    const nextMemberState = !isMember;
    setIsMember(nextMemberState);
    const { data: updatedArtist } = await supabase.from("artists").select("members").eq("id", artist.id).single();
    if (updatedArtist) {
      setMemberCount(updatedArtist.members ?? 0);
      useStore.setState((state) => ({
        artists: state.artists.map((item) => item.id === artist.id ? { ...item, members: updatedArtist.members ?? 0 } : item),
      }));
    } else {
      setMemberCount((count) => Math.max(0, count + (nextMemberState ? 1 : -1)));
    }
    toast.success(nextMemberState ? `You joined ${artist.name}'s community` : `You left ${artist.name}'s community`);
    setMembershipLoading(false);
  };

  const submit = () => {
    if (!auth) { navigate("auth"); return; }
    if (!body.trim()) return;
    setPosts((p) => [{ id: Math.random().toString(36).slice(2), userId: auth.id, username: auth.username, body: body.trim(), createdAt: new Date().toISOString(), comments: [] }, ...p]);
    setBody("");
    toast.success("Posted to the community");
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("community")} className="gap-1">
        <ChevronLeft className="size-4" /> Back to Community
      </Button>

      <div className={`relative overflow-hidden rounded-2xl ${coverClass(artist.coverIndex)}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative flex flex-col items-start justify-between gap-4 p-6 text-white sm:flex-row sm:items-end sm:p-10">
          <div>
            <Badge className="mb-2 bg-black/40 text-white backdrop-blur">{artist.genre}</Badge>
            <h1 className="text-3xl font-bold sm:text-4xl">{artist.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm opacity-90"><Users className="size-4" /> {memberCount} {memberCount === 1 ? "person" : "people"} in the crowd</p>
          </div>
          <Button disabled={membershipLoading} onClick={toggleMembership} variant={isMember ? "secondary" : "default"} className="gap-1.5">
            <Users className="size-4" /> {membershipLoading ? "Please wait…" : isMember ? "Joined · Leave" : "Join"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="bg-card/60">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Music className="size-4 text-primary" /> Discussion board</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {auth ? (
                <div className="space-y-2">
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Share something with the community..." />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={submit} className="gap-1.5"><Send className="size-4" /> Post</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" onClick={() => navigate("auth")}>Sign in to post</Button>
              )}

              {posts.length === 0 ? (
                <EmptyState title="No posts yet" message="Be the first to start the conversation." />
              ) : (
                posts.map((p) => (
                  <div key={p.id} className="rounded-lg border border-border/40 p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback style={{ background: avatarGradient(p.username.length * 17), color: "#0A1228" }} className="text-[10px] font-bold">
                          {avatarInitials(p.username)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium">{p.username}</p>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(p.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm">{p.body}</p>
                    {p.comments.length > 0 && (
                      <div className="mt-2 space-y-1 border-l-2 border-border/40 pl-2">
                        {p.comments.map((c) => (
                          <div key={c.id} className="text-xs">
                            <span className="font-medium">{c.username}</span>{" "}
                            <span className="text-muted-foreground">{c.body}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="bg-card/60">
            <CardHeader><CardTitle className="text-base">Concerts by {artist.name}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {artistConcerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No concerts listed yet.</p>
              ) : (
                artistConcerts.map((c) => <ConcertCard key={c.id} concert={c} compact />)
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/40">
            <CardContent className="p-4 text-xs text-muted-foreground">
              <p>This is a fan community. Be kind. Don't leak. Tag spoilers.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
