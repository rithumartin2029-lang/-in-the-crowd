"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/site/EmptyState";
import { Section } from "@/components/site/Section";
import { coverClass, timeAgo } from "@/lib/utils";
import {
  BookOpen,
  Users,
  Frown,
  Music,
  PiggyBank,
  Star,
  Heart,
  Radio,
  Image as ImageIcon,
  Users2,
  Plus,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function UntilImThere() {
  const {
    auth,
    diary,
    addDiary,
    dreamSetlists,
    addDreamSetlist,
    oneDayFund,
    addFundContribution,
    somedayConcerts,
    addSomeday,
    markSomedayFulfilled,
    songThatMadeMyNight,
    addSongMadeNight,
    togetherMessages,
    concerts,
    memories,
    navigate,
  } = useStore();

  if (!auth) return null;

  const fundPct = Math.min(100, Math.round((oneDayFund.saved / oneDayFund.goal) * 100));

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">A little corner</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Until I'm There</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          A little corner for concert dreams, missed moments, shared memories and the hope of being there someday.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* A. CONCERT DIARY */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="size-4 text-accent" /> A · Concert Diary</CardTitle>
            <CardDescription>Write the night in your own words.</CardDescription>
          </CardHeader>
          <DiarySection diary={diary} addDiary={addDiary} />
        </Card>

        {/* B. EXPERIENCE IT TOGETHER */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="size-4 text-primary" /> B · Experience It Together</CardTitle>
            <CardDescription>Find a chat room. Not a live stream — words from the crowd.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {togetherMessages.length} messages across {concerts.length} concert rooms.
            </p>
            <Button onClick={() => navigate("together")} className="gap-1.5">
              Open Together <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>

        {/* C. MISSED CONCERT WALL */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Frown className="size-4 text-destructive" /> C · Missed Concert Wall</CardTitle>
            <CardDescription>The shows that got away.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {concerts.filter((c) => c.past).slice(0, 3).map((c) => (
              <div key={c.id} className="rounded-lg border border-border/40 p-2 text-sm">
                <p className="font-medium">{c.artist}</p>
                <p className="text-xs text-muted-foreground">{c.tour} · {c.city}</p>
                <Button size="sm" variant="ghost" className="mt-1 h-7" onClick={() => navigate("concert-detail", { concertId: c.id })}>Remember together</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* D. DREAM SETLISTS */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Music className="size-4 text-primary" /> D · Dream Setlists</CardTitle>
            <CardDescription>Imagine the perfect night, song by song.</CardDescription>
          </CardHeader>
          <DreamSetlistSection dreamSetlists={dreamSetlists} addDreamSetlist={addDreamSetlist} />
        </Card>

        {/* E. ONE DAY FUND */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><PiggyBank className="size-4 text-accent" /> E · One Day Fund</CardTitle>
            <CardDescription>Stash a little for someday.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-primary">${oneDayFund.saved}</p>
              <p className="text-xs text-muted-foreground">of ${oneDayFund.goal}</p>
            </div>
            <Progress value={fundPct} />
            <FundAdd onAdd={(amt, label) => { addFundContribution({ amount: amt, label }); toast.success(`Added $${amt}`); }} />
            <div className="space-y-1">
              {oneDayFund.contributions.slice(-3).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>${c.amount} — {c.label}</span>
                  <span>{new Date(c.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* F. SOMEDAY SOMEWHERE */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Star className="size-4 text-primary" /> F · Someday Somewhere</CardTitle>
            <CardDescription>The concert you'd travel anywhere for.</CardDescription>
          </CardHeader>
          <SomedaySection somedayConcerts={somedayConcerts} addSomeday={addSomeday} markFulfilled={markSomedayFulfilled} />
        </Card>

        {/* G. SONG MADE MY NIGHT */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Heart className="size-4 text-destructive" /> G · The Song That Made My Night</CardTitle>
            <CardDescription>The one that did it.</CardDescription>
          </CardHeader>
          <SongSection songThatMadeMyNight={songThatMadeMyNight} addSongMadeNight={addSongMadeNight} />
        </Card>

        {/* H. CONCERT PULSE */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Radio className="size-4 text-accent" /> H · Concert Pulse</CardTitle>
            <CardDescription>Authorized updates from inside the room.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {togetherMessages.filter((m) => m.type === "song-update").slice(0, 3).map((m) => (
              <div key={m.id} className="rounded-lg border border-primary/30 bg-primary/5 p-2 text-xs">
                <p className="font-medium">{m.username}</p>
                <p className="text-muted-foreground">{m.text}</p>
              </div>
            ))}
            {togetherMessages.filter((m) => m.type === "song-update").length === 0 && (
              <p className="text-xs text-muted-foreground">No pulses yet.</p>
            )}
          </CardContent>
        </Card>

        {/* I. MEMORY POSTCARD */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ImageIcon className="size-4 text-primary" /> I · Memory Postcard</CardTitle>
            <CardDescription>One photo, one caption, one feeling.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {memories.filter((m) => m.userId === auth.id).slice(0, 2).map((m) => (
              <div key={m.id} className="rounded-lg border border-border/40 p-2">
                <div className={`mb-2 h-20 ${coverClass(1)}`} />
                <p className="text-xs line-clamp-2">{m.caption}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(m.createdAt)}</p>
              </div>
            ))}
            <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => navigate("explore")}>
              <Plus className="size-4" /> Add a memory
            </Button>
          </CardContent>
        </Card>

        {/* J. CONCERT FRIENDSHIP MEMORIES */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users2 className="size-4 text-primary" /> J · Concert Friendship Memories</CardTitle>
            <CardDescription>The nights shared with someone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {diary.filter((d) => d.body.toLowerCase().includes("friend") || d.body.toLowerCase().includes("together")).slice(0, 2).map((d) => (
              <div key={d.id} className="rounded-lg border border-border/40 p-2 text-xs">
                <p className="font-medium">{d.title}</p>
                <p className="text-muted-foreground line-clamp-2">{d.body}</p>
              </div>
            ))}
            {diary.filter((d) => d.body.toLowerCase().includes("friend") || d.body.toLowerCase().includes("together")).length === 0 && (
              <p className="text-xs text-muted-foreground">No shared nights yet. Write one in your diary.</p>
            )}
            <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("connections")}>Find concert friends</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DiarySection({ diary, addDiary }: { diary: ReturnType<typeof useStore.getState>["diary"]; addDiary: ReturnType<typeof useStore.getState>["addDiary"] }) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  return (
    <CardContent className="space-y-2">
      {open ? (
        <div className="space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="What happened? How did it feel?" />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => {
              if (!title.trim() || !body.trim()) { toast.error("Add title and body"); return; }
              addDiary({ title: title.trim(), body: body.trim(), date: new Date().toISOString(), imageUrls: [] });
              setTitle(""); setBody(""); setOpen(false);
              toast.success("Diary saved");
            }}>Save</Button>
          </div>
        </div>
      ) : (
        <>
          {diary.length === 0 ? (
            <EmptyState title="Nothing written yet" message="The page is patient." className="py-4" />
          ) : (
            diary.slice(0, 2).map((d) => (
              <div key={d.id} className="rounded-lg border border-border/40 p-2 text-sm">
                <p className="font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{d.body}</p>
              </div>
            ))
          )}
          <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => setOpen(true)}><Plus className="size-4" /> Write</Button>
        </>
      )}
    </CardContent>
  );
}

function DreamSetlistSection({ dreamSetlists, addDreamSetlist }: { dreamSetlists: ReturnType<typeof useStore.getState>["dreamSetlists"]; addDreamSetlist: ReturnType<typeof useStore.getState>["addDreamSetlist"] }) {
  const [open, setOpen] = React.useState(false);
  const [artist, setArtist] = React.useState("");
  const [opening, setOpening] = React.useState("");
  const [closing, setClosing] = React.useState("");
  const [special, setSpecial] = React.useState("");
  const [moment, setMoment] = React.useState("");
  const [favorites, setFavorites] = React.useState("");
  return (
    <CardContent className="space-y-2">
      {open ? (
        <div className="space-y-2">
          <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist" />
          <Input value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="Opening song" />
          <Input value={favorites} onChange={(e) => setFavorites(e.target.value)} placeholder="Favourites (comma separated)" />
          <Input value={special} onChange={(e) => setSpecial(e.target.value)} placeholder="Special moment / guest" />
          <Input value={closing} onChange={(e) => setClosing(e.target.value)} placeholder="Closing song" />
          <Textarea value={moment} onChange={(e) => setMoment(e.target.value)} rows={2} placeholder="The moment you'd want to live forever" />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => {
              if (!artist.trim()) { toast.error("Add artist"); return; }
              addDreamSetlist({
                artist: artist.trim(),
                opening: opening.trim(),
                favorites: favorites.split(",").map((s) => s.trim()).filter(Boolean),
                special: special.trim(),
                closing: closing.trim(),
                moment: moment.trim(),
              });
              setArtist(""); setOpening(""); setClosing(""); setSpecial(""); setMoment(""); setFavorites("");
              setOpen(false); toast.success("Dream setlist saved");
            }}>Save</Button>
          </div>
        </div>
      ) : (
        <>
          {dreamSetlists.length === 0 ? (
            <EmptyState title="No dream setlists" message="Imagine the perfect night." className="py-4" />
          ) : (
            dreamSetlists.slice(0, 2).map((s) => (
              <div key={s.id} className="rounded-lg border border-border/40 p-2 text-sm">
                <p className="font-medium">{s.artist}</p>
                <p className="text-xs text-muted-foreground">Opens: {s.opening || "—"} · Closes: {s.closing || "—"}</p>
              </div>
            ))
          )}
          <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => setOpen(true)}><Plus className="size-4" /> Dream one</Button>
        </>
      )}
    </CardContent>
  );
}

function FundAdd({ onAdd }: { onAdd: (amt: number, label: string) => void }) {
  const [amt, setAmt] = React.useState("");
  const [label, setLabel] = React.useState("");
  return (
    <div className="flex gap-2">
      <Input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="$" className="w-20" inputMode="numeric" />
      <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What you gave up" />
      <Button size="sm" onClick={() => {
        const n = parseInt(amt, 10);
        if (!n || n <= 0) { toast.error("Add an amount"); return; }
        onAdd(n, label.trim() || "Contribution"); setAmt(""); setLabel("");
      }}>Add</Button>
    </div>
  );
}

function SomedaySection({ somedayConcerts, addSomeday, markFulfilled }: {
  somedayConcerts: ReturnType<typeof useStore.getState>["somedayConcerts"];
  addSomeday: ReturnType<typeof useStore.getState>["addSomeday"];
  markFulfilled: ReturnType<typeof useStore.getState>["markSomedayFulfilled"];
}) {
  const [artist, setArtist] = React.useState("");
  const [concert, setConcert] = React.useState("");
  return (
    <CardContent className="space-y-2">
      {somedayConcerts.length === 0 ? (
        <EmptyState title="No someday yet" message="Add the one you'd travel for." className="py-4" />
      ) : (
        somedayConcerts.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/40 p-2 text-sm">
            <div><p className="font-medium">{s.artist}</p><p className="text-xs text-muted-foreground">{s.concert}</p></div>
            <Button size="sm" variant={s.fulfilled ? "default" : "outline"} onClick={() => markFulfilled(s.id)}>
              {s.fulfilled ? "Done" : "Mark done"}
            </Button>
          </div>
        ))
      )}
      <div className="flex gap-2">
        <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist" />
        <Input value={concert} onChange={(e) => setConcert(e.target.value)} placeholder="Concert" />
        <Button size="sm" onClick={() => {
          if (!artist.trim() || !concert.trim()) { toast.error("Add artist & concert"); return; }
          addSomeday({ artist: artist.trim(), concert: concert.trim() });
          setArtist(""); setConcert(""); toast.success("Someday saved");
        }}>Add</Button>
      </div>
    </CardContent>
  );
}

function SongSection({ songThatMadeMyNight, addSongMadeNight }: {
  songThatMadeMyNight: ReturnType<typeof useStore.getState>["songThatMadeMyNight"];
  addSongMadeNight: ReturnType<typeof useStore.getState>["addSongMadeNight"];
}) {
  const [song, setSong] = React.useState("");
  const [why, setWhy] = React.useState("");
  return (
    <CardContent className="space-y-2">
      {songThatMadeMyNight.length === 0 ? (
        <EmptyState title="No song yet" message="The one that did it." className="py-4" />
      ) : (
        songThatMadeMyNight.map((s) => (
          <div key={s.id} className="rounded-lg border border-border/40 p-2 text-sm">
            <p className="font-medium">♪ {s.song}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{s.why}</p>
          </div>
        ))
      )}
      <div className="space-y-2">
        <Input value={song} onChange={(e) => setSong(e.target.value)} placeholder="Song name" />
        <Textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={2} placeholder="Why this song?" />
        <Button size="sm" className="w-full" onClick={() => {
          if (!song.trim()) { toast.error("Add a song"); return; }
          addSongMadeNight({ song: song.trim(), why: why.trim() });
          setSong(""); setWhy(""); toast.success("Saved");
        }}>Add song</Button>
      </div>
    </CardContent>
  );
}
