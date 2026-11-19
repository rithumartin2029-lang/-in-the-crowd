"use client";

import * as React from "react";
import { useStore, type ConnectionKind, type ConnectionLink, type User } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/site/EmptyState";
import { Section } from "@/components/site/Section";
import { Shield, Search, Heart, TicketCheck, UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";

const SAFETY = [
  "Buddy requests stay pending until the other person accepts.",
  "FOMO Buddies and Concert Buddies are separate connections.",
  "Concert Buddy Mode is off by default; turn it on only when you want to be discoverable.",
  "You can decline requests freely and report anyone who makes you uncomfortable.",
];

export default function Connections() {
  const {
    auth, registeredUsers, connections, follows, sendConnectionRequest,
    acceptConnection, declineConnection, followUser, unfollowUser, updateProfile, navigate,
    loadFromSupabase, liveMode,
  } = useStore();
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    if (liveMode) void loadFromSupabase();
  }, [liveMode, loadFromSupabase]);

  if (!auth) return null;

  const others = registeredUsers.filter((u) => u.id !== auth.id);
  const matched = others.filter((u) =>
    !q.trim() ||
    u.username.toLowerCase().includes(q.toLowerCase()) ||
    u.favArtists.some((a) => a.toLowerCase().includes(q.toLowerCase()))
  );

  const getLink = (kind: ConnectionKind, userId: string) =>
    (kind === "fomo" ? connections.fomo : connections.buddies).find((link) => link.userId === userId);

  const request = async (user: User, kind: ConnectionKind) => {
    const ok = await sendConnectionRequest(user.id, kind);
    if (ok) toast.success(kind === "fomo" ? `FOMO Buddy request sent to ${user.username}` : `Concert Buddy request sent to ${user.username}`);
    else toast.error("That request is already active, or could not be sent.");
  };

  const actOnRequest = async (link: ConnectionLink, kind: ConnectionKind, accept: boolean) => {
    const ok = accept
      ? await acceptConnection(link.userId, kind)
      : await declineConnection(link.userId, kind);
    if (ok) toast.success(accept ? "Request accepted" : "Request declined");
    else toast.error("Could not update that request. Please refresh and try again.");
  };

  const fomoLinks = connections.fomo;
  const buddyLinks = connections.buddies;
  const followingLinks = follows.filter((link) => link.direction === "following");
  const followerLinks = follows.filter((link) => link.direction === "follower");
  const followingIds = new Set(followingLinks.map((link) => link.userId));

  const toggleFollow = async (user: User) => {
    const wasFollowing = followingIds.has(user.id);
    const ok = wasFollowing ? await unfollowUser(user.id) : await followUser(user.id);
    if (ok) toast.success(wasFollowing ? `Unfollowed ${user.username}` : `Following ${user.username}`);
    else toast.error("Could not update your follow. Please try again.");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <Section title="Connections" description="Meet the people who love the same music.">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><Shield className="size-4 text-primary" /> Safety first</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {SAFETY.map((s, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-primary">•</span> {s}</li>)}
            </ul>
          </CardContent>
        </Card>
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/60"><CardContent className="p-4"><p className="text-2xl font-semibold">{followingLinks.length}</p><p className="text-xs text-muted-foreground">Following</p></CardContent></Card>
        <Card className="bg-card/60"><CardContent className="p-4"><p className="text-2xl font-semibold">{followerLinks.length}</p><p className="text-xs text-muted-foreground">Followers</p></CardContent></Card>
      </div>

      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Search className="size-4 text-primary" /> Find people</CardTitle>
          <CardDescription>Search by username or favourite artist. You'll see their name, never their account ID.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
            <div>
              <p className="text-sm font-medium">Concert Buddy Mode</p>
              <p className="text-xs text-muted-foreground">Let other fans find you as a Concert Buddy.</p>
            </div>
            <Switch checked={auth.buddyMode} onCheckedChange={(v) => { updateProfile({ buddyMode: v }); toast.success(v ? "Concert Buddy Mode is on" : "Concert Buddy Mode is off"); }} />
          </div>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username or artist..." />
          {matched.length === 0 ? (
            <EmptyState title="No people found" message="Try another username or artist." />
          ) : (
            <div className="space-y-2">
              {matched.map((user) => {
                const fomo = getLink("fomo", user.id);
                const buddy = getLink("buddy", user.id);
                return (
                  <div key={user.id} className="flex flex-col gap-3 rounded-lg border border-border/40 p-3 sm:flex-row sm:items-center">
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{user.username || "Crowd member"}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.favArtists.join(", ") || "Favourite artists not added yet"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={followingIds.has(user.id) ? "secondary" : "default"} onClick={() => void toggleFollow(user)}>
                        {followingIds.has(user.id) ? <><UserCheck className="mr-1 size-4" /> Following</> : <><UserPlus className="mr-1 size-4" /> Follow</>}
                      </Button>
                      {followerLinks.some((link) => link.userId === user.id) && <Badge variant="outline">Follows you</Badge>}
                      <RelationshipButton kind="fomo" link={fomo} onRequest={() => request(user, "fomo")} onAccept={() => fomo && actOnRequest(fomo, "fomo", true)} onDecline={() => fomo && actOnRequest(fomo, "fomo", false)} />
                      {user.buddyMode && <RelationshipButton kind="buddy" link={buddy} onRequest={() => request(user, "buddy")} onAccept={() => buddy && actOnRequest(buddy, "buddy", true)} onDecline={() => buddy && actOnRequest(buddy, "buddy", false)} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <ConnectionSection title="FOMO Buddies" description="Fans you connect with over shared artists and concert feelings." icon="fomo" links={fomoLinks} users={registeredUsers} onAccept={(l) => actOnRequest(l, "fomo", true)} onDecline={(l) => actOnRequest(l, "fomo", false)} />
        <ConnectionSection title="Concert Buddies" description="Fans who are open to being your concert companion." icon="buddy" links={buddyLinks} users={registeredUsers} onAccept={(l) => actOnRequest(l, "buddy", true)} onDecline={(l) => actOnRequest(l, "buddy", false)} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FollowList title="Following" links={followingLinks} users={registeredUsers} actionLabel="Unfollow" onAction={(id) => void unfollowUser(id)} />
        <FollowList title="Followers" links={followerLinks} users={registeredUsers} actionLabel="Follow back" followingIds={followingIds} onAction={(id) => void followUser(id)} />
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={() => navigate("community")}>Open the FOMO Wall</Button>
      </div>
    </div>
  );
}


function FollowList({ title, links, users, actionLabel, followingIds, onAction }: {
  title: string;
  links: { userId: string }[];
  users: User[];
  actionLabel: string;
  followingIds?: Set<string>;
  onAction: (userId: string) => void;
}) {
  return (
    <Card className="bg-card/60">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">No {title.toLowerCase()} yet.</p>
        ) : links.map((link) => {
          const user = users.find((item) => item.id === link.userId);
          return (
            <div key={link.userId} className="flex items-center justify-between gap-2 rounded-lg border border-border/40 p-3">
              <p className="truncate text-sm font-medium">{user?.username || "Crowd member"}</p>
              {(!followingIds || !followingIds.has(link.userId)) && (
                <Button size="sm" variant="outline" onClick={() => onAction(link.userId)}>{actionLabel}</Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RelationshipButton({ kind, link, onRequest, onAccept, onDecline }: {
  kind: ConnectionKind;
  link?: ConnectionLink;
  onRequest: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const label = kind === "fomo" ? "FOMO Buddy" : "Concert Buddy";
  if (!link || (link.status === "declined" && link.direction === "outgoing")) {
    return <Button size="sm" variant="outline" onClick={onRequest}>Add {label}</Button>;
  }
  if (link.status === "declined") return <Badge variant="secondary">{label} · Declined</Badge>;
  if (link.status === "accepted") return <Badge variant="default">{label} · Connected</Badge>;
  if (link.direction === "outgoing") return <Badge variant="secondary">{label} · Request sent</Badge>;
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" onClick={onAccept}>Accept {label}</Button>
      <Button size="sm" variant="ghost" onClick={onDecline}>Decline</Button>
    </div>
  );
}

function ConnectionSection({ title, description, icon, links, users, onAccept, onDecline }: {
  title: string;
  description: string;
  icon: "fomo" | "buddy";
  links: ConnectionLink[];
  users: User[];
  onAccept: (link: ConnectionLink) => void;
  onDecline: (link: ConnectionLink) => void;
}) {
  const visible = links.filter((link) => link.status === "accepted" || link.status === "pending");
  const nameFor = (id: string) => users.find((user) => user.id === id)?.username || "Crowd member";
  return (
    <Card className="bg-card/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon === "fomo" ? <Heart className="size-4 text-primary" /> : <TicketCheck className="size-4 text-primary" />}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.length === 0 ? (
          <EmptyState title={icon === "fomo" ? "No FOMO Buddies yet" : "No Concert Buddies yet"} message="Find someone above to start connecting." />
        ) : visible.map((link) => (
          <div key={link.userId} className="flex items-center justify-between gap-2 rounded-lg border border-border/40 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{nameFor(link.userId)}</p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {link.status === "accepted" ? "Connected" : link.direction === "incoming" ? "Request received" : "Request sent"}
              </Badge>
            </div>
            {link.status === "pending" && link.direction === "incoming" && (
              <div className="flex shrink-0 gap-1">
                <Button size="sm" onClick={() => onAccept(link)}>Accept</Button>
                <Button size="sm" variant="ghost" onClick={() => onDecline(link)}>Decline</Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
