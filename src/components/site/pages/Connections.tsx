"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/site/EmptyState";
import { Section } from "@/components/site/Section";
import { Shield, Heart, Users, Search } from "lucide-react";
import { toast } from "sonner";

const SAFETY = [
  "Never share personal contact details in your FOMO labels.",
  "Buddy requests are pending until you accept. Decline freely.",
  "You can mute or report any user from their profile or message.",
  "Concert Buddy Mode is OFF by default. Turn it on only if you want to be found.",
  "If something feels off, report it. Our team reviews every report.",
];

export default function Connections() {
  const { auth, registeredUsers, connections, sendConnectionRequest, acceptConnection, declineConnection, updateProfile, navigate } = useStore();
  const [q, setQ] = React.useState("");

  if (!auth) return null;

  const others = registeredUsers.filter((u) => u.id !== auth.id);
  const matched = others.filter((u) =>
    !q.trim() ||
    u.username.toLowerCase().includes(q.toLowerCase()) ||
    u.favArtists.some((a) => a.toLowerCase().includes(q.toLowerCase()))
  );

  const fomoLabels = [
    { label: "Same FOMO", value: "I missed Echo Valley in Lisbon" },
    { label: "Same Dream Concert", value: "Lumina Sky — Reykjavik" },
    { label: "Shared Artist", value: "Aurora Lane" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <Section title="Connections" description="Find the ones who feel the same way.">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><Shield className="size-4 text-primary" /> Safety first</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {SAFETY.map((s, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-primary">•</span> {s}</li>)}
            </ul>
          </CardContent>
        </Card>
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        {/* FOMO matches */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Heart className="size-4 text-primary" /> Share Your FOMO</CardTitle>
            <CardDescription>People who feel the same way.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {fomoLabels.map((f) => (
              <div key={f.label} className="rounded-lg border border-border/40 p-3">
                <Badge variant="secondary">{f.label}</Badge>
                <p className="mt-1 text-sm">{f.value}</p>
                <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={() => {
                  sendConnectionRequest(f.label);
                  toast.success(`Looking for people matching: ${f.label}`);
                }}>
                  <Search className="size-4" /> Find matches
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Find buddies */}
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="size-4 text-primary" /> Find Concert Buddies</CardTitle>
            <CardDescription>Search by artist or concert.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border/40 p-2">
              <div>
                <p className="text-sm font-medium">Concert Buddy Mode</p>
                <p className="text-xs text-muted-foreground">Let others find you for shared concerts.</p>
              </div>
              <Switch checked={auth.buddyMode} onCheckedChange={(v) => { updateProfile({ buddyMode: v }); toast.success(v ? "Buddy mode on" : "Buddy mode off"); }} />
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username or artist..." className="pl-9" />
            </div>
            {matched.length === 0 ? (
              <EmptyState title="No one here yet" message="Try a different search, or invite a friend to the crowd." />
            ) : (
              <div className="space-y-2">
                {matched.slice(0, 5).map((u) => {
                  const buddy = connections.buddies.find((b) => b.userId === u.id);
                  return (
                    <div key={u.id} className="flex items-center justify-between rounded-lg border border-border/40 p-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{u.username}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.favArtists.join(", ") || "No favourite artists yet"}</p>
                      </div>
                      {buddy ? (
                        <Badge variant={buddy.status === "accepted" ? "default" : "secondary"}>{buddy.status}</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { sendConnectionRequest(u.id); toast.success(`Request sent to ${u.username}`); }}>Request</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Buddy requests */}
      <Section title="Buddy requests">
        {connections.buddies.length === 0 ? (
          <EmptyState title="No requests yet" message="Find someone to share a concert with." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {connections.buddies.map((b) => (
              <div key={b.userId} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                <div>
                  <p className="text-sm font-medium">{b.userId}</p>
                  <Badge variant="secondary" className="mt-1 capitalize">{b.status}</Badge>
                </div>
                {b.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { acceptConnection(b.userId); toast.success("Accepted"); }}>Accept</Button>
                    <Button size="sm" variant="ghost" onClick={() => { declineConnection(b.userId); toast.success("Declined"); }}>Decline</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={() => navigate("community")}>Open the FOMO Wall</Button>
      </div>
    </div>
  );
}
