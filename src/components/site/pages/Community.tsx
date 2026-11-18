"use client";

import * as React from "react";
import { useStore, type FomoPost } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/site/EmptyState";
import { PledgeDialog } from "@/components/site/PledgeDialog";
import { ConcertCard } from "@/components/site/ConcertCard";
import { Section } from "@/components/site/Section";
import { timeAgo, coverClass, softCount } from "@/lib/utils";
import { Heart, MessageCircle, Users, Music, Send, Sparkles, Frown, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Community() {
  const {
    auth,
    fomoPosts,
    addFomoPost,
    addFomoComment,
    reactFomo,
    navigate,
    concerts,
    artists,
    gentleMode,
  } = useStore();

  const [body, setBody] = React.useState("");
  const [pledgeOpen, setPledgeOpen] = React.useState(false);
  const [showBox, setShowBox] = React.useState(false);

  const submitPost = () => {
    if (!auth) { navigate("auth"); return; }
    if (!auth.pledgeAcceptedAt) { setPledgeOpen(true); return; }
    if (!body.trim()) return;
    addFomoPost({ userId: auth.id, username: auth.username, body: body.trim() });
    setBody("");
    toast.success("Posted to the FOMO Wall");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <Section title="Community" description="A space for the ones who made it, missed it, and are still dreaming.">
        <Tabs defaultValue="fomo">
          <TabsList className="flex-wrap">
            <TabsTrigger value="fomo" className="gap-1.5"><Heart className="size-4" /> FOMO Wall</TabsTrigger>
            <TabsTrigger value="missed" className="gap-1.5"><Frown className="size-4" /> Missed Moments</TabsTrigger>
            <TabsTrigger value="watch" className="gap-1.5"><Calendar className="size-4" /> Watch Parties</TabsTrigger>
            <TabsTrigger value="artists" className="gap-1.5"><Users className="size-4" /> Artist Communities</TabsTrigger>
          </TabsList>

          {/* FOMO WALL */}
          <TabsContent value="fomo" className="mt-4 space-y-4">
            {gentleMode ? (
              <EmptyState title="FOMO Wall is in gentle mode" message="Take a breath. The wall will be here when you're ready." />
            ) : (
              <>
                {!auth ? (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm">Sign in to share on the FOMO Wall.</p>
                      <Button size="sm" className="mt-2" onClick={() => navigate("auth")}>Sign in</Button>
                    </CardContent>
                  </Card>
                ) : showBox ? (
                  <Card>
                    <CardContent className="space-y-2 p-4">
                      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="How are you feeling about a show you saw, missed, or are dreaming of?" />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowBox(false)}>Cancel</Button>
                        <Button size="sm" onClick={submitPost} className="gap-1.5"><Send className="size-4" /> Post</Button>
                      </div>
                      {!auth.pledgeAcceptedAt && (
                        <p className="text-xs text-muted-foreground">First post? We'll ask you to take the Respectful Crowd Pledge.</p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Button onClick={() => setShowBox(true)} className="gap-1.5"><Heart className="size-4" /> Share on the FOMO Wall</Button>
                )}

                <div className="space-y-3">
                  {fomoPosts.length === 0 ? (
                    <EmptyState title="No posts yet" message="Be the first to share how a concert felt." />
                  ) : (
                    fomoPosts.map((p) => (
                      <FomoCard
                        key={p.id}
                        post={p}
                        onReact={(k) => reactFomo(p.id, k)}
                        onComment={(b) => {
                          if (!auth) { navigate("auth"); return; }
                          addFomoComment(p.id, b);
                          toast.success("Comment added");
                        }}
                        canComment={!!auth}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* MISSED MOMENTS */}
          <TabsContent value="missed" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fomoPosts.filter((p) => p.body.toLowerCase().includes("miss")).map((p) => (
                <Card key={p.id} className="bg-card/60">
                  <CardContent className="p-4">
                    <p className="text-sm line-clamp-4">{p.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">by {p.username} · {timeAgo(p.createdAt)}</p>
                  </CardContent>
                </Card>
              ))}
              {fomoPosts.filter((p) => p.body.toLowerCase().includes("miss")).length === 0 && (
                <EmptyState title="No missed moments yet" message="Share one on the FOMO Wall — start it with 'missed'." />
              )}
            </div>
          </TabsContent>

          {/* WATCH PARTIES */}
          <TabsContent value="watch" className="mt-4">
            <Section title="Together rooms" description="Each concert has a chat room. Not a live stream — a place to gather.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {concerts.slice(0, 6).map((c) => (
                  <button key={c.id} onClick={() => navigate("together", { concertId: c.id })} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3 text-left">
                    <div className={`size-12 shrink-0 rounded-lg ${coverClass(c.coverIndex)}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.artist}</p>
                      <p className="text-xs text-muted-foreground">{c.tour}</p>
                    </div>
                    <Button size="sm" variant="outline">Join</Button>
                  </button>
                ))}
              </div>
            </Section>
          </TabsContent>

          {/* ARTIST COMMUNITIES */}
          <TabsContent value="artists" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {artists.map((a) => (
                <Card key={a.id} className="overflow-hidden bg-card/60">
                  <div className={`relative h-20 ${coverClass(a.coverIndex)}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <p className="absolute bottom-2 left-3 font-bold text-white">{a.name}</p>
                  </div>
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{a.genre}</span>
                      <span>{softCount(a.members * 17, gentleMode)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => { toast.success(`Joined ${a.name}`); }}>Join</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate("artist-community", { artistId: a.id })}>Open</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Section>

      <PledgeDialog
        open={pledgeOpen}
        onOpenChange={setPledgeOpen}
        onAccept={() => {
          useStore.getState().updateProfile({ pledgeAcceptedAt: new Date().toISOString() });
          setPledgeOpen(false);
          toast.success("Pledge accepted — your post is live");
          if (body.trim()) submitPost();
        }}
        onCancel={() => setPledgeOpen(false)}
      />
    </div>
  );
}

function FomoCard({
  post,
  onReact,
  onComment,
  canComment,
}: {
  post: FomoPost;
  onReact: (k: "heart" | "relatable" | "cry") => void;
  onComment: (b: string) => void;
  canComment: boolean;
}) {
  const [comment, setComment] = React.useState("");
  const [showComments, setShowComments] = React.useState(false);
  return (
    <Card className="bg-card/60">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary text-xs font-bold">
            {post.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{post.username}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed">{post.body}</p>
        <div className="flex items-center gap-2">
          <ReactionBtn icon={<Heart className="size-3.5" />} count={post.reactions.heart} onClick={() => onReact("heart")} label="heart" />
          <ReactionBtn icon={<Sparkles className="size-3.5" />} count={post.reactions.relatable} onClick={() => onReact("relatable")} label="relatable" />
          <ReactionBtn icon={<Frown className="size-3.5" />} count={post.reactions.cry} onClick={() => onReact("cry")} label="cry" />
          <Button size="sm" variant="ghost" className="ml-auto gap-1.5" onClick={() => setShowComments((v) => !v)}>
            <MessageCircle className="size-3.5" /> {post.comments.length}
          </Button>
        </div>
        {showComments && (
          <div className="space-y-2 border-t border-border/40 pt-2">
            {post.comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-muted/30 p-2 text-xs">
                <p className="font-medium">{c.username}</p>
                <p className="text-muted-foreground">{c.body}</p>
              </div>
            ))}
            {canComment && (
              <div className="flex gap-2">
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a kind comment..." className="h-8 text-xs" />
                <Button size="sm" onClick={() => { if (comment.trim()) { onComment(comment.trim()); setComment(""); } }}>Send</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReactionBtn({ icon, count, onClick, label }: { icon: React.ReactNode; count: number; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-full border border-border/40 px-2 py-0.5 text-xs transition-colors hover:border-primary/40 hover:text-primary"
      aria-label={label}
    >
      {icon}
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
