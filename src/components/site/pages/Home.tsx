"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConcertCard } from "@/components/site/ConcertCard";
import { Section } from "@/components/site/Section";
import { EmptyState } from "@/components/site/EmptyState";
import { formatCountdown, coverClass, formatConcertDate, timeAgo, softCount } from "@/lib/utils";
import { Sparkles, Music, Compass, Calendar, Heart, ArrowRight, Search, Sparkle, Plus } from "lucide-react";
import { StartSpaceButton } from "@/components/site/StartSpaceDialog";
import { toast } from "sonner";

export default function Home() {
  const {
    concerts,
    artists,
    memories,
    fomoPosts,
    bucketList,
    countdowns,
    diary,
    dreamSetlists,
    navigate,
    auth,
    gentleMode,
    toggleGentleMode,
    somedayConcerts,
  } = useStore();
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const upcoming = concerts.filter((c) => !c.past).slice(0, 6);
  const past = concerts.filter((c) => c.past).slice(0, 3);
  const publicMems = memories.filter((m) => m.visibility === "public" && m.approved).slice(0, 6);
  const userCountdowns = auth ? countdowns.filter((c) => !auth || true).slice(0, 3) : [];
  const fomoHighlights = fomoPosts.slice(0, 3);
  const hasConcerts = concerts.length > 0;

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("q") ?? "").trim();
    if (!q) return;
    navigate("explore");
    toast("Looking through the crowd", { description: `Searching for "${q}"` });
  };

  return (
    <div className="space-y-12 px-4 py-6 sm:px-6 sm:py-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card/80 to-primary/10 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative max-w-3xl">
          {hasConcerts ? (
            <Badge className="mb-4 gap-1 bg-primary/15 text-primary">
              <Sparkle className="size-3" /> {concerts.length} space{concerts.length === 1 ? "" : "s"} in the crowd
            </Badge>
          ) : (
            <Badge className="mb-4 gap-1 bg-primary/15 text-primary">
              <Sparkle className="size-3" /> A quiet stage, waiting for you
            </Badge>
          )}
          <h1 className="logo-glow text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Somewhere, We're All in the Crowd.
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            For the ones who made it. For the ones who missed it. For the ones still dreaming.
          </p>
          <form onSubmit={onSearch} className="mt-5 flex max-w-lg gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" placeholder="Search artists, concerts, cities..." className="pl-9" />
            </div>
            <Button type="submit">Search</Button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">
            {auth ? (
              <StartSpaceButton label="Start a space" size="sm" />
            ) : (
              <Button size="sm" onClick={() => navigate("auth")} className="gap-1.5">
                <Plus className="size-4" /> Start a space
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => navigate("explore")} className="gap-1.5">
              <Compass className="size-4" /> Explore concerts
            </Button>
            <Button size="sm" variant="ghost" onClick={() => toggleGentleMode(!gentleMode)} className="gap-1.5">
              <Sparkles className="size-4" /> {gentleMode ? "Gentle mode is on" : "Turn on Gentle Mode"}
            </Button>
          </div>
          {!hasConcerts && auth && (
            <p className="mt-3 text-sm text-muted-foreground">
              No spaces yet. Start one for a concert you went to, missed, or dream of — others can find it and join.
            </p>
          )}
          {!auth && (
            <p className="mt-3 text-sm text-muted-foreground">
              Sign in to start a space for a concert you went to, missed, or dream of.
            </p>
          )}
        </div>
      </section>

      {/* GENTLE MODE CONTENT (replaces FOMO/highlights) */}
      {gentleMode && (
        <Section
          title="Take your time"
          description="Music waits for you. So do we."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card/60">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Heart className="size-4 text-primary" /> Your diary</CardTitle></CardHeader>
              <CardContent>
                {diary.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing written yet. The page is patient.</p>
                ) : (
                  diary.slice(0, 1).map((d) => (
                    <div key={d.id}>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{d.body}</p>
                    </div>
                  ))
                )}
                <Button size="sm" variant="ghost" className="mt-2 -ml-2" onClick={() => navigate("myspace")}>Open diary</Button>
              </CardContent>
            </Card>
            <Card className="bg-card/60">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Music className="size-4 text-accent" /> Dream setlists</CardTitle></CardHeader>
              <CardContent>
                {dreamSetlists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Dream a setlist when you're ready.</p>
                ) : (
                  dreamSetlists.slice(0, 1).map((s) => (
                    <div key={s.id}>
                      <p className="text-sm font-medium">{s.artist}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-3">Opens with {s.opening}. Closes with {s.closing}.</p>
                    </div>
                  ))
                )}
                <Button size="sm" variant="ghost" className="mt-2 -ml-2" onClick={() => navigate("until-im-there")}>Dream one</Button>
              </CardContent>
            </Card>
            <Card className="bg-card/60">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Calendar className="size-4 text-primary" /> Your bucket list</CardTitle></CardHeader>
              <CardContent>
                {bucketList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No concerts on the list yet.</p>
                ) : (
                  <p className="text-sm">{bucketList.length} dream{bucketList.length === 1 ? "" : "s"} on your list.</p>
                )}
                <Button size="sm" variant="ghost" className="mt-2 -ml-2" onClick={() => navigate("bucket-list")}>See list</Button>
              </CardContent>
            </Card>
          </div>
          <p className="mt-4 text-center text-sm italic text-muted-foreground">
            "Music waits for you. So do we."
          </p>
        </Section>
      )}

      {/* UPCOMING CONCERTS */}
      {!gentleMode && (
        <Section
          title="Upcoming in the crowd"
          description="Concerts people are looking forward to."
          action={
            <div className="flex items-center gap-2">
              {auth && <StartSpaceButton label="Start" size="sm" variant="ghost" />}
              {hasConcerts && (
                <Button size="sm" variant="ghost" onClick={() => navigate("explore")} className="gap-1">See all <ArrowRight className="size-4" /></Button>
              )}
            </div>
          }
        >
          {upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming spaces yet"
              message={auth ? "Be the first to start one — a concert you went to, missed, or dream of." : "Sign in to start one, or browse existing spaces once people add them."}
            />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-3 scroll-soft">
              {upcoming.map((c) => (
                <div key={c.id} className="min-w-[260px] max-w-[260px]">
                  <ConcertCard concert={c} />
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* USER COUNTDOWNS */}
      {auth && userCountdowns.length > 0 && (
        <Section title="Your next countdown" description="Live ticking, just for you.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userCountdowns.map((c) => {
              const t = formatCountdown(new Date(c.date).getTime());
              return (
                <Card key={c.id} className="overflow-hidden">
                  <div className={`relative h-20 ${coverClass(1)}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-3 text-white">
                      <p className="text-xs opacity-80">{c.artist}</p>
                      <p className="text-sm font-bold">{c.concert}</p>
                    </div>
                  </div>
                  <CardContent className="pt-3">
                    {t.done ? (
                      <p className="text-center text-lg font-bold text-primary">I WAS THERE!</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-1 text-center">
                        <Stat n={t.days} l="days" />
                        <Stat n={t.hours} l="hrs" />
                        <Stat n={t.minutes} l="min" />
                        <Stat n={t.seconds} l="sec" />
                      </div>
                    )}
                    <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => navigate("countdown")}>All countdowns</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {/* RECENT MEMORIES (hidden if gentle) */}
      {!gentleMode && publicMems.length > 0 && (
        <Section
          title="Recently added to the library"
          description="Shared by people who were there."
          action={<Button size="sm" variant="ghost" onClick={() => navigate("explore")} className="gap-1">Explore library <ArrowRight className="size-4" /></Button>}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicMems.map((m) => {
              const concert = concerts.find((c) => c.id === m.concertId);
              return (
                <button
                  key={m.id}
                  onClick={() => concert && navigate("concert-detail", { concertId: concert.id })}
                  className="polaroid overflow-hidden rounded-xl p-0 text-left"
                >
                  <div className={`relative h-32 ${coverClass(concert?.coverIndex ?? 1)}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <Badge className="absolute left-2 top-2 bg-black/40 text-white">{m.type}</Badge>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <p className="text-xs opacity-80">{concert?.artist}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm line-clamp-3">{m.caption}</p>
                    <p className="mt-1 text-xs text-muted-foreground">by {m.username} · {timeAgo(m.createdAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* FOMO HIGHLIGHTS (hidden if gentle) */}
      {!gentleMode && fomoHighlights.length > 0 && (
        <Section
          title="From the FOMO Wall"
          description="The crowd feeling things together."
          action={<Button size="sm" variant="ghost" onClick={() => navigate("community")} className="gap-1">Open Community <ArrowRight className="size-4" /></Button>}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {fomoHighlights.map((f) => (
              <Card key={f.id} className="bg-card/60">
                <CardContent className="pt-4">
                  <p className="text-sm leading-relaxed line-clamp-4">{f.body}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>by {f.username}</span>
                    <span>{f.reactions.heart + f.reactions.relatable + f.reactions.cry} reactions</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* UNTIL I'M THERE TEASER */}
      <Section title="Until I'm There">
        <Card className="relative overflow-hidden border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent" />
          <CardContent className="relative grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">A little corner for concert dreams</p>
              <h3 className="mt-1 text-xl font-bold">Until I'm There</h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                A little corner for concert dreams, missed moments, shared memories and the hope of being there someday.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => navigate("until-im-there")} className="gap-1.5">
                  Open Until I'm There <ArrowRight className="size-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate("community")}>Missed Moments wall</Button>
              </div>
            </div>
            <div className="grid size-24 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="size-10" />
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* RECOMMENDED ARTIST COMMUNITIES */}
      <Section
        title="Artist communities"
        description="Where fans gather, share, and dream."
        action={<Button size="sm" variant="ghost" onClick={() => navigate("community")} className="gap-1">All communities <ArrowRight className="size-4" /></Button>}
      >
        {artists.length === 0 ? (
          <EmptyState
            title="No artist communities yet"
            message={auth ? "Start a space — the artist gets a community page automatically." : "Sign in and start a space to create one."}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artists.slice(0, 6).map((a) => (
              <button
                key={a.id}
                onClick={() => navigate("artist-community", { artistId: a.id })}
                className="polaroid flex items-center gap-3 rounded-xl p-3 text-left"
              >
                <div className={`size-14 shrink-0 rounded-lg ${coverClass(a.coverIndex)}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.genre || "Community"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{softCount(a.members, gentleMode)}</p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0">Join</Button>
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* PAST SHOWS / SOMEDAY */}
      <Section title="Past nights & someday dreams">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Recently played</p>
            {past.length === 0 ? (
              <EmptyState title="No past nights yet" message="Spaces become past nights after their date passes." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {past.map((c) => (
                  <ConcertCard key={c.id} concert={c} compact />
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Someday, somewhere</p>
            {somedayConcerts.length === 0 ? (
              <EmptyState title="No someday concerts yet" message="Add one in Until I'm There." />
            ) : (
              somedayConcerts.slice(0, 3).map((s) => (
                <div key={s.id} className="mb-2 flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <div>
                    <p className="text-sm font-medium">{s.artist}</p>
                    <p className="text-xs text-muted-foreground">{s.concert}</p>
                  </div>
                  <Badge variant={s.fulfilled ? "default" : "secondary"}>{s.fulfilled ? "Fulfilled" : "Someday"}</Badge>
                </div>
              ))
            )}
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => navigate("until-im-there")}>Add someday</Button>
          </div>
        </div>
      </Section>

      {/* QUICK BUCKET LIST */}
      {auth && (
        <Section
          title="Quick bucket list"
          action={<Button size="sm" variant="ghost" onClick={() => navigate("bucket-list")} className="gap-1">Open <ArrowRight className="size-4" /></Button>}
        >
          {bucketList.length === 0 ? (
            <EmptyState title="Your bucket list is empty" message="Add the concerts you dream of seeing one day." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bucketList.slice(0, 6).map((b) => (
                <Card key={b.id} className="bg-card/60">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{b.artist}</p>
                        <p className="text-xs text-muted-foreground">{b.concert}</p>
                      </div>
                      <Badge variant={b.attended ? "default" : "secondary"}>{b.attended ? "Was there" : "Dreaming"}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Section>
      )}

      {!auth && (
        <Section title="Make it yours">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
              <div className="grid size-12 place-items-center rounded-lg bg-primary/15 text-primary">
                <Music className="size-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Sign in to start your bucket list, countdowns, and diary.</p>
                <p className="text-sm text-muted-foreground">Somewhere, we're all in the crowd.</p>
              </div>
              <Button onClick={() => navigate("auth")}>Sign in</Button>
            </CardContent>
          </Card>
        </Section>
      )}
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-md bg-muted/40 py-1.5">
      <p className="text-lg font-bold tabular-nums text-primary">{String(n).padStart(2, "0")}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</p>
    </div>
  );
}
