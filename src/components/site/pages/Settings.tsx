"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PledgeDialog } from "@/components/site/PledgeDialog";
import {
  User,
  Eye,
  Bell,
  Sparkles,
  Shield,
  Trash2,
  LogOut,
  Heart,
  Moon,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { avatarGradient, avatarInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Settings() {
  const {
    auth,
    updateProfile,
    updateSettings,
    settings,
    toggleTheme,
    theme,
    toggleGentleMode,
    gentleMode,
    setGentleUntil,
    spoilerShields,
    toggleSpoilerShield,
    concerts,
    signOut,
    resetAll,
  } = useStore();
  const [pledgeOpen, setPledgeOpen] = React.useState(false);
  const [favArtists, setFavArtists] = React.useState(auth?.favArtists.join(", ") ?? "");
  const [favSongs, setFavSongs] = React.useState(auth?.favSongs.join(", ") ?? "");
  const [bio, setBio] = React.useState(auth?.bio ?? "");

  if (!auth) return null;

  const saveProfile = () => {
    updateProfile({
      bio,
      favArtists: favArtists.split(",").map((s) => s.trim()).filter(Boolean),
      favSongs: favSongs.split(",").map((s) => s.trim()).filter(Boolean),
    });
    toast.success("Profile updated");
  };

  const shieldedConcerts = concerts.filter((c) => spoilerShields.includes(c.id));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Badge variant="secondary">Demo account</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><User className="size-4 text-primary" /> Profile</CardTitle>
          <CardDescription>Edit how you show up in the crowd.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback style={{ background: avatarGradient(auth.avatarSeed), color: "#0A1228" }} className="font-bold">
                {avatarInitials(auth.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{auth.username}</p>
              <p className="text-xs text-muted-foreground">{auth.email}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A line about you and your music." />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fa">Favourite artists (comma separated)</Label>
              <Input id="fa" value={favArtists} onChange={(e) => setFavArtists(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fs">Favourite songs (comma separated)</Label>
              <Input id="fs" value={favSongs} onChange={(e) => setFavSongs(e.target.value)} />
            </div>
          </div>
          <Button onClick={saveProfile}>Save profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Eye className="size-4 text-primary" /> Privacy</CardTitle>
          <CardDescription>Choose what other people can see about you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow label="Profile visible" desc="Others can view your profile card" checked={settings.profileVisible} onChange={(v) => updateSettings({ profileVisible: v })} />
          <ToggleRow label="Show attended concerts" checked={settings.showAttended} onChange={(v) => updateSettings({ showAttended: v })} />
          <ToggleRow label="Show bucket list" checked={settings.showBucketList} onChange={(v) => updateSettings({ showBucketList: v })} />
          <ToggleRow label="Show memories" checked={settings.showMemories} onChange={(v) => updateSettings({ showMemories: v })} />
          <ToggleRow label="Concert Buddy Mode" desc="Let others find you for shared concerts" checked={auth.buddyMode} onChange={(v) => updateProfile({ buddyMode: v })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Bell className="size-4 text-primary" /> Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow label="Email notifications" checked={settings.emailNotifications} onChange={(v) => updateSettings({ emailNotifications: v })} />
          <ToggleRow label="Push notifications" checked={settings.pushNotifications} onChange={(v) => updateSettings({ pushNotifications: v })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs"><Clock className="size-3" /> Quiet hours start</Label>
              <Input type="time" value={settings.quietHoursStart} onChange={(e) => updateSettings({ quietHoursStart: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs"><Clock className="size-3" /> Quiet hours end</Label>
              <Input type="time" value={settings.quietHoursEnd} onChange={(e) => updateSettings({ quietHoursEnd: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-accent" /> Wellbeing</CardTitle>
          <CardDescription>Take your time. The crowd will wait.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Gentle Mode</p>
              <p className="text-xs text-muted-foreground">Soften the palette, hide FOMO content, mute spoilers.</p>
            </div>
            <Switch checked={gentleMode} onCheckedChange={(v) => toggleGentleMode(v)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { toggleGentleMode(true); setGentleUntil(Date.now() + 1000 * 60 * 60 * 24); toast.success("Gentle mode for today"); }}>
              Just for today
            </Button>
            <Button variant="outline" size="sm" onClick={() => { toggleGentleMode(true); setGentleUntil(Date.now() + 1000 * 60 * 60 * 24 * 7); toast.success("Gentle mode for a week"); }}>
              For a week
            </Button>
            <Button variant="outline" size="sm" onClick={() => { toggleGentleMode(false); setGentleUntil(null); toast.success("Gentle mode off"); }}>
              Turn off
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Light or dark.</p>
            </div>
            <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
              {theme === "dark" ? <Moon className="size-4" /> : <Sparkles className="size-4" />}
              {theme === "dark" ? "Dark" : "Light"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Shield className="size-4 text-primary" /> Spoiler Shield</CardTitle>
          <CardDescription>Concerts you've shielded from spoilers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {shieldedConcerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No concerts shielded. Tap the shield on any concert to hide setlist/spoilery content.</p>
          ) : (
            shieldedConcerts.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/40 p-2">
                <div className="text-sm">
                  <p className="font-medium">{c.artist}</p>
                  <p className="text-xs text-muted-foreground">{c.tour}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => toggleSpoilerShield(c.id)}>Unshield</Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Heart className="size-4 text-primary" /> Respectful Crowd Pledge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You accepted the pledge on{" "}
            <span className="font-medium text-foreground">
              {auth.pledgeAcceptedAt ? new Date(auth.pledgeAcceptedAt).toLocaleDateString() : "—"}
            </span>.
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setPledgeOpen(true)}>Re-read the pledge</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><User className="size-4 text-destructive" /> Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { signOut(); toast.success("Signed out"); }}>
              <LogOut className="size-4" /> Sign out
            </Button>
            <Button variant="destructive" size="sm" onClick={() => { resetAll(); }}>
              <Trash2 className="size-4" /> Delete account & clear data
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Demo authentication — client-side only. Deleting clears all localStorage for this site.
          </p>
        </CardContent>
      </Card>

      <PledgeDialog open={pledgeOpen} onOpenChange={setPledgeOpen} onAccept={() => { updateProfile({ pledgeAcceptedAt: new Date().toISOString() }); setPledgeOpen(false); toast.success("Pledge renewed"); }} onCancel={() => setPledgeOpen(false)} />
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
