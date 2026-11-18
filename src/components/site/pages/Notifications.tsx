"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/site/EmptyState";
import { timeAgo } from "@/lib/utils";
import { Bell, Check, Heart, Music, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  fomo: Heart,
  memory: Music,
  buddy: Users,
  spoiler: Sparkles,
  system: Bell,
};

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead, gentleMode } = useStore();
  const [tab, setTab] = React.useState<"all" | "unread">("all");

  const list = notifications.filter((n) => {
    if (gentleMode && !n.spoilerSafe) return false;
    if (tab === "unread") return !n.read;
    return true;
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-primary" />
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button variant="ghost" size="sm" onClick={() => { markAllNotificationsRead(); toast.success("All marked as read"); }}>
            <Check className="size-4" /> Mark all read
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread")}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="space-y-2 mt-4">
          {list.length === 0 ? (
            <EmptyState title="No notifications" message="You're all caught up. The crowd is quiet for now." />
          ) : (
            list.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                    n.read ? "border-border/40 bg-transparent" : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${n.read ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}>
                    <Icon className="size-4" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {!n.read && <Badge variant="secondary" className="text-[10px]">new</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
