"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/site/EmptyState";
import { Section } from "@/components/site/Section";
import { AddBucketSheet } from "./BucketListInline";
import { CountdownInline, CountdownInlineAdd } from "./CountdownInline";
import { timeAgo, avatarGradient, avatarInitials, coverClass } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Music,
  Sparkles,
  Heart,
  Users,
  Image as ImageIcon,
  PiggyBank,
  Star,
  BookOpen,
  PenLine,
  ChevronRight,
  Plus,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { StartSpaceButton } from "@/components/site/StartSpaceDialog";

export default function MySpace() {
  const {
    auth,
    bucketList,
    countdowns,
    diary,
    dreamSetlists,
    oneDayFund,
    somedayConcerts,
    songThatMadeMyNight,
    memories,
    connections,
    navigate,
    addDiary,
    concerts,
  } = useStore();

  const [diaryOpen, setDiaryOpen] = React.useState(false);
  const [dTitle, setDTitle] = React.useState("");
  const [dBody, setDBody] = React.useState("");

  if (!auth) return null;

  const myMemories = memories.filter((m) => m.userId === auth.id);
  const pending = myMemories.filter((m) => !m.approved && m.visibility === "public");
  const approved = myMemories.filter((m) => m.approved);
  const startedSpaces = concerts.filter((c) => auth.startedConcertIds.includes(c.id));
  const joinedSpaces = concerts.filter((c) => auth.joinedConcertIds.includes(c.id) && !auth.startedConcertIds.includes(c.id));

  const submitDiary = () => {
    if (!dTitle.trim() || !dBody.trim()) {
      toast.error("Add a title and body");
      return;
    }
    addDiary({ title: dTitle.trim(), body: dBody.trim(), date: new Date().toISOString(), imageUrls: [] });
    setDTitle(""); setDBody(""); setDiaryOpen(false);
    toast.success("Diary entry added");
  };

  const fundPct = Math.min(100, Math.round((oneDayFund.saved / oneDayFund.goal) * 100));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Space</h1>
          <p className="text-sm text-muted-foreground">Your corner of the crowd.</p>
        </div>
        <div className="flex items-center gap-2">
          <StartSpaceButton label="Start a space" size="sm" variant="secondary" />
          <Button variant="outline" size="sm" onClick={() => navigate("settings")}>Settings</Button>
        </div>
      </div>

      {/* SPACES I STARTED / JOINED */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-primary" /> Spaces I started</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate("explore")} className="gap-1"><ChevronRight className="size-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {startedSpaces.length === 0 ? (
              <EmptyState title="No spaces yet" message="Start one for a concert you went to, missed, or dream of." className="py-6" />
            ) : (
              startedSpaces.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate("concert-detail", { concertId: c.id })}
                  className="flex w-full items-center gap-3 rounded-lg border border-border/40 p-2 text-left hover:border-primary/40"
                >
                  <div className={`size-9 shrink-0 rounded-md ${coverClass(c.coverIndex)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.artist}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.tour}{c.city ? ` · ${c.city}` : ""}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 gap-1"><Sparkles className="size-3" /> Host</Badge>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Users className="size-4 text-primary" /> Spaces I joined</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate("together")} className="gap-1"><ChevronRight className="size-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {joinedSpaces.length === 0 ? (
              <EmptyState title="Not joined anywhere yet" message="Find spaces in Explore and tap Join to follow along." className="py-6" />
            ) : (
              joinedSpaces.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate("concert-detail", { concertId: c.id })}
                  className="flex w-full items-center gap-3 rounded-lg border border-border/40 p-2 text-left hover:border-primary/40"
                >
                  <div className={`size-9 shrink-0 rounded-md ${coverClass(c.coverIndex)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.artist}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.tour}{c.city ? ` · ${c.city}` : ""}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 gap-1"><Check className="size-3" /> Joined</Badge>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* PROFILE */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
          <Avatar className="size-16">
            <AvatarFallback style={{ background: avatarGradient(auth.avatarSeed), color: "#0A1228" }} className="text-lg font-bold">
              {avatarInitials(auth.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">{auth.username}</p>
              {auth.role === "admin" && <Badge variant="secondary">admin</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{auth.email}</p>
            {auth.bio && <p className="mt-1 text-sm">{auth.bio}</p>}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {auth.favArtists.slice(0, 3).map((a) => <Badge key={a} variant="outline">{a}</Badge>)}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("settings")}>Edit profile</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* BUCKET LIST */}
        <Card className="bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Calendar className="size-4 text-primary" /> My Bucket List</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate("bucket-list")} className="gap-1"><ChevronRight className="size-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {bucketList.length === 0 ? (
              <EmptyState title="Nothing yet" message="Add concerts you dream of." className="py-6" />
            ) : (
              bucketList.slice(0, 3).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-border/40 p-2 text-sm">
                  <div><p className="font-medium">{b.artist}</p><p className="text-xs text-muted-foreground">{b.concert}</p></div>
                  <Badge variant={b.attended ? "default" : "secondary"}>{b.attended ? "Was there" : "Dreaming"}</Badge>
                </div>
              ))
            )}
            <AddBucketSheet />
          </CardContent>
        </Card>

        {/* COUNTDOWNS */}
        <Card className="bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-primary" /> My Countdowns</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate("countdown")} className="gap-1"><ChevronRight className="size-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {countdowns.length === 0 ? (
              <EmptyState title="No countdowns" message="Add one to watch the days tick." className="py-6" />
            ) : (
              countdowns.slice(0, 3).map((c) => (
                <div key={c.id} className="rounded-lg border border-border/40 p-2 text-sm">
                  <p className="font-medium">{c.artist}</p>
                  <p className="text-xs text-muted-foreground">{c.concert}</p>
                  <CountdownInline date={c.date} />
                </div>
              ))
            )}
            <CountdownInlineAdd />
          </CardContent>
        </Card>

        {/* DIARY */}
        <Card className="bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="size-4 text-accent" /> Concert Diary</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setDiaryOpen((v) => !v)} className="gap-1">
              <PenLine className="size-4" /> Write
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {diaryOpen && (
              <div className="space-y-2 rounded-lg border border-border/40 p-2">
                <Input value={dTitle} onChange={(e) => setDTitle(e.target.value)} placeholder="Title" className="h-8 text-sm" />
                <Textarea value={dBody} onChange={(e) => setDBody(e.target.value)} rows={3} placeholder="What happened? How did it feel?" className="text-sm" />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setDiaryOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={submitDiary}>Save</Button>
                </div>
              </div>
            )}
            {diary.length === 0 ? (
              <EmptyState title="No entries yet" message="Write your first night in words." className="py-6" />
            ) : (
              diary.slice(0, 3).map((d) => (
                <div key={d.id} className="rounded-lg border border-border/40 p-2 text-sm">
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{d.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(d.date)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* DREAM SETLISTS */}
        <Card className="bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Music className="size-4 text-primary" /> Dream Setlists</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate("until-im-there")} className="gap-1"><ChevronRight className="size-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {dreamSetlists.length === 0 ? (
              <EmptyState title="No dream setlists" message="Imagine the perfect night." className="py-6" />
            ) : (
              dreamSetlists.slice(0, 2).map((s) => (
                <div key={s.id} className="rounded-lg border border-border/40 p-2 text-sm">
                  <p className="font-medium">{s.artist}</p>
                  <p className="text-xs text-muted-foreground">Opens: {s.opening} · Closes: {s.closing}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ONE DAY FUND */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><PiggyBank className="size-4 text-accent" /> One Day Fund</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-primary">${oneDayFund.saved}</p>
              <p className="text-xs text-muted-foreground">of ${oneDayFund.goal}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${fundPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{fundPct}% of the way there.</p>
            <Button size="sm" variant="outline" onClick={() => navigate("until-im-there")}>Add to fund</Button>
          </CardContent>
        </Card>

        {/* SOMEDAY */}
        <Card className="bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><Star className="size-4 text-primary" /> Someday Somewhere</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate("until-im-there")} className="gap-1"><ChevronRight className="size-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {somedayConcerts.length === 0 ? (
              <EmptyState title="No someday yet" message="Add concerts you'd travel anywhere for." className="py-6" />
            ) : (
              somedayConcerts.slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/40 p-2 text-sm">
                  <div><p className="font-medium">{s.artist}</p><p className="text-xs text-muted-foreground">{s.concert}</p></div>
                  <Badge variant={s.fulfilled ? "default" : "secondary"}>{s.fulfilled ? "Done" : "Someday"}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* SONG MADE NIGHT */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Heart className="size-4 text-destructive" /> Song That Made My Night</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {songThatMadeMyNight.length === 0 ? (
              <EmptyState title="No song yet" message="The one that did it." className="py-6" />
            ) : (
              songThatMadeMyNight.slice(0, 2).map((s) => (
                <div key={s.id} className="rounded-lg border border-border/40 p-2 text-sm">
                  <p className="font-medium">{s.song}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.why}</p>
                </div>
              ))
            )}
            <Button size="sm" variant="outline" onClick={() => navigate("until-im-there")}>Add a song</Button>
          </CardContent>
        </Card>
      </div>

      {/* MEMORIES */}
      <Section title="Memory Postcards" description="Your uploads and their review status.">
        {myMemories.length === 0 ? (
          <EmptyState title="No memories uploaded" message="Add one from any concert's library." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {myMemories.slice(0, 6).map((m) => (
              <div key={m.id} className="rounded-lg border border-border/40 p-3 text-sm">
                <div className={`mb-2 h-16 ${coverClass(1)}`} />
                <p className="line-clamp-2 text-xs">{m.caption}</p>
                <div className="mt-1 flex items-center justify-between">
                  <Badge variant={m.approved ? "default" : "secondary"}>
                    {m.visibility === "public" ? (m.approved ? "Live" : "Pending") : m.visibility}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(m.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* CONNECTIONS */}
      <Section title="Connections" description="FOMO matches and concert buddies.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="bg-card/60">
            <CardContent className="p-4">
              <p className="text-sm font-medium">FOMO matches</p>
              {connections.fomo.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">No matches yet.</p>
              ) : (
                connections.fomo.map((f) => <p key={f.userId} className="text-xs">{f.label}</p>)
              )}
              <Button size="sm" variant="outline" className="mt-2" onClick={() => navigate("connections")}>Find matches</Button>
            </CardContent>
          </Card>
          <Card className="bg-card/60">
            <CardContent className="p-4">
              <p className="text-sm font-medium">Concert buddies</p>
              {connections.buddies.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">No buddy requests.</p>
              ) : (
                connections.buddies.map((b) => (
                  <p key={b.userId} className="text-xs">{b.userId} — {b.status}</p>
                ))
              )}
              <Button size="sm" variant="outline" className="mt-2" onClick={() => navigate("connections")}>Find buddies</Button>
            </CardContent>
          </Card>
        </div>
      </Section>

      {pending.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="p-4">
            <p className="text-sm font-medium">{pending.length} memor{pending.length === 1 ? "y" : "ies"} pending review</p>
            <p className="text-xs text-muted-foreground">Public uploads appear after a moderator approves them.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
