"use client";

import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Music,
  Compass,
  Users,
  MessageCircle,
  Home as HomeIcon,
  Bell,
  Moon,
  Sun,
  Sparkles,
  Settings as SettingsIcon,
  LogOut,
  Shield,
  Search,
  User as UserIcon,
  Images,
  Ticket,
  MoreHorizontal,
} from "lucide-react";
import { avatarGradient, avatarInitials } from "@/lib/utils";
import { toast } from "sonner";
import { StartSpaceButton } from "@/components/site/StartSpaceDialog";

const NAV = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "explore", label: "Explore", icon: Compass },
  { key: "community", label: "Community", icon: MessageCircle },
  { key: "stories", label: "Stories", icon: Sparkles },
  { key: "crowd-chat", label: "Crowd Chat", icon: MessageCircle },
  { key: "myspace", label: "My Space", icon: UserIcon },
];

export function Header() {
  const { auth, view, navigate, setView, gentleMode, toggleGentleMode, theme, toggleTheme, notifications, signOut } = useStore();
  const unread = notifications.filter((n) => !n.read && (gentleMode ? n.spoilerSafe : true)).length;
  const [q, setQ] = React.useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate("explore");
    toast("Searching the crowd", { description: `Looking for "${q.trim()}"` });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button
          onClick={() => setView("home")}
          className="logo-glow flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary/20 text-primary">
            <Music className="size-5" />
          </span>
          <span className="hidden sm:inline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            In the Crowd
          </span>
        </button>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => navigate(n.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === n.key
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <n.icon className="size-4" />
              {n.label}
            </button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <MoreHorizontal className="size-4" /> More
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => navigate("memories")}><Images className="size-4" /> Crowd Memories</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("tickets")}><Ticket className="size-4" /> Digital Tickets</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("together")}><Users className="size-4" /> Concert Rooms</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <form onSubmit={onSearch} className="hidden flex-1 max-w-xs items-center md:flex md:ml-auto">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search artists, concerts, cities..."
              className="h-9 pl-9"
            />
          </div>
        </form>

        {auth && (
          <StartSpaceButton
            label="Start a space"
            size="sm"
            variant="secondary"
            className="hidden md:inline-flex"
          />
        )}

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle gentle mode"
            onClick={() => {
              toggleGentleMode();
              toast(gentleMode ? "Gentle mode off" : "Gentle mode on", {
                description: gentleMode ? "Welcome back to the full crowd." : "Take your time. We'll keep things soft.",
              });
            }}
            className={gentleMode ? "text-accent" : ""}
          >
            <Sparkles className="size-4" />
          </Button>

          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            onClick={() => navigate(auth ? "notifications" : "auth")}
            className="relative"
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-destructive text-[10px] text-white">
                {unread}
              </span>
            )}
          </Button>

          {auth ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-muted">
                  <Avatar className="size-8">
                    <AvatarFallback
                      style={{ background: avatarGradient(auth.avatarSeed), color: "#0A1228" }}
                      className="text-xs font-bold"
                    >
                      {avatarInitials(auth.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">{auth.username}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>{auth.username}</span>
                  {auth.role === "admin" && <Badge variant="secondary">Admin</Badge>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("myspace")}>
                  <UserIcon className="size-4" /> My Space
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("settings")}>
                  <SettingsIcon className="size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("notifications")}>
                  <Bell className="size-4" /> Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("memories")}><Images className="size-4" /> Crowd Memories</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("tickets")}><Ticket className="size-4" /> Digital Tickets</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("together")}><Users className="size-4" /> Concert Rooms</DropdownMenuItem>
                {auth.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("admin")}>
                    <Shield className="size-4" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("founder-story")}>
                  <Sparkles className="size-4" /> Where it all began
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("takedown")}>
                  <Shield className="size-4" /> Takedown request
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    toast("Signed out", { description: "See you in the crowd." });
                  }}
                >
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => navigate("auth")} className="ml-1">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export { NAV };
