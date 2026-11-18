"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/site/EmptyState";
import { Section } from "@/components/site/Section";
import { coverClass, timeAgo, softCount } from "@/lib/utils";
import {
  Users,
  Shield,
  Music,
  Ticket,
  Image as ImageIcon,
  MessageSquare,
  Flag,
  Copyright,
  Lock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const {
    auth,
    registeredUsers,
    reports,
    memories,
    concerts,
    fomoPosts,
    togetherMessages,
    updateMemory,
    notifications,
  } = useStore();

  if (!auth || auth.role !== "admin") {
    return (
      <div className="px-4 py-10">
        <EmptyState title="Admin only" message="Sign in as a demo admin to view this dashboard." />
        <p className="mt-3 text-center text-xs text-muted-foreground">
          On the sign-in page, click "Login as demo admin".
        </p>
      </div>
    );
  }

  const pendingMemories = memories.filter((m) => m.visibility === "public" && !m.approved);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
          <Shield className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground">Moderation dashboard (demo)</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat icon={<Users className="size-4" />} label="Users" value={String(registeredUsers.length)} />
        <Stat icon={<ImageIcon className="size-4" />} label="Pending memories" value={String(pendingMemories.length)} />
        <Stat icon={<Flag className="size-4" />} label="Reports" value={String(reports.length)} />
        <Stat icon={<MessageSquare className="size-4" />} label="Together messages" value={String(togetherMessages.length)} />
      </div>

      <Tabs defaultValue="users">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users">Users &amp; reports</TabsTrigger>
          <TabsTrigger value="rooms">Concert rooms</TabsTrigger>
          <TabsTrigger value="memories">Memories moderation</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="tickets">Ticket verification</TabsTrigger>
          <TabsTrigger value="takedown">Takedowns</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Registered users</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Fav artists</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registeredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.favArtists.join(", ") || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {registeredUsers.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No users yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Reports</CardTitle></CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <EmptyState title="No reports" message="Clean crowd." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.targetType}</TableCell>
                        <TableCell className="font-mono text-xs">{r.targetId}</TableCell>
                        <TableCell className="text-xs">{r.reason}</TableCell>
                        <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                        <TableCell><Button size="sm" variant="ghost" onClick={() => toast.success("Marked resolved")}>Resolve</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Concert rooms</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concert</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {concerts.map((c) => {
                    const count = togetherMessages.filter((m) => m.concertId === c.id).length;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.artist} <span className="text-xs text-muted-foreground">— {c.tour}</span></TableCell>
                        <TableCell>{count}</TableCell>
                        <TableCell>{c.past ? <Badge variant="secondary">archive</Badge> : <Badge>active</Badge>}</TableCell>
                        <TableCell><Button size="sm" variant="ghost" onClick={() => toast.success("Room frozen")}>Freeze</Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memories" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Memories moderation</CardTitle></CardHeader>
            <CardContent>
              {pendingMemories.length === 0 ? (
                <EmptyState title="Nothing to review" message="All caught up." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {pendingMemories.map((m) => (
                    <div key={m.id} className="rounded-lg border border-border/40 p-3">
                      <div className={`mb-2 h-20 ${coverClass(1)}`} />
                      <p className="text-sm line-clamp-2">{m.caption}</p>
                      <p className="mt-1 text-xs text-muted-foreground">by {m.username} · {timeAgo(m.createdAt)}</p>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => { updateMemory(m.id, { approved: true }); toast.success("Approved"); }}>
                          <CheckCircle2 className="size-4" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { updateMemory(m.id, { approved: false, visibility: "private" }); toast.success("Rejected"); }}>
                          <XCircle className="size-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Artist / organizer submissions</CardTitle></CardHeader>
            <CardContent>
              <EmptyState title="No pending submissions" message="When artists or organizers submit a concert, it appears here for review." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <Card className="border-amber-500/30 bg-amber-500/10">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Ticket className="size-4" /> Ticket verification</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm">Requires verification integration with a ticketing provider.</p>
              <Badge variant="secondary" className="mt-2">Placeholder</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="takedown" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Copyright className="size-4" /> Copyright takedown requests</CardTitle></CardHeader>
            <CardContent>
              {reports.filter((r) => r.targetType === "takedown").length === 0 ? (
                <EmptyState title="No takedowns" message="Submitted requests appear here." />
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Target</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {reports.filter((r) => r.targetType === "takedown").map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.targetId}</TableCell>
                        <TableCell className="text-xs">{r.reason}</TableCell>
                        <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Lock className="size-4" /> Privacy / security incidents</CardTitle></CardHeader>
            <CardContent>
              <EmptyState title="No incidents" message="Reported incidents are tracked here for review." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Section title="Community activity">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card><CardContent className="p-4 text-sm"><p className="font-medium">FOMO posts</p><p className="text-2xl font-bold text-primary">{fomoPosts.length}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-sm"><p className="font-medium">Memories</p><p className="text-2xl font-bold text-primary">{memories.length}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-sm"><p className="font-medium">Notifications sent</p><p className="text-2xl font-bold text-primary">{notifications.length}</p></CardContent></Card>
        </div>
      </Section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="bg-card/60">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">{icon}</span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
