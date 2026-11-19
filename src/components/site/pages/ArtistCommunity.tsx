"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConcertCard } from "@/components/site/ConcertCard";
import { Section } from "@/components/site/Section";
import { EmptyState } from "@/components/site/EmptyState";
import { coverClass, softCount, timeAgo, avatarGradient, avatarInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Music, Send, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface Post { id: string; userId: string; username: string; body: string; createdAt: string; comments: { id: string; userId: string; username: string; body: string }[] }

export default function ArtistCommunity() {
  const { artists, selectedArtistId, concerts, navigate, gentleMode, auth } = useStore();
  const artist = artists.find((a) => a.id === selectedArtistId);
  const [posts, setPosts] = React.useState<Post[]>([
    {
      id: "p1",
      userId: "u-demo",
      username: "soft lights",
      body: "Anyone else counting down to Reykjavik? I keep listening to Paper Lanterns on loop.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      comments: [
        { id: "c1", userId: "u-demo2", username: "petal", body: "Same. I cannot wait." },
      ],
    },
  ]);
  const [body, setBody] = React.useState("");

  if (!artist) {
    return (
      <div className="px-4 py-10">
        <EmptyState title="No artist selected" message="Pick one from Explore." />
      </div>
    );
  }

  const artistConcerts = concerts.filter((c) => c.artist === artist.name);

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
        <div className="relative flex items-end justify-between gap-4 p-6 text-white sm:p-10">
          <div>
            <Badge className="mb-2 bg-black/40 text-white backdrop-blur">{artist.genre}</Badge>
            <h1 className="text-3xl font-bold sm:text-4xl">{artist.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm opacity-90"><Users className="size-4" /> {softCount(artist.members, gentleMode)}</p>
          </div>
          <Button onClick={() => toast.success(`Joined ${artist.name}`)} className="gap-1.5"><Users className="size-4" /> Join</Button>
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
