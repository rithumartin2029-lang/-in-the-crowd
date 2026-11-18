"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PledgeDialog } from "@/components/site/PledgeDialog";
import { Music, UserPlus, LogIn } from "lucide-react";
import { toast } from "sonner";
import { avatarGradient, avatarInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Auth({ message }: { message?: string }) {
  const { signIn, signUp, navigate } = useStore();
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const [showPledge, setShowPledge] = React.useState(false);

  // login form
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPass, setLoginPass] = React.useState("");

  // register form
  const [rName, setRName] = React.useState("");
  const [rEmail, setREmail] = React.useState("");
  const [rPass, setRPass] = React.useState("");
  const [rSeed, setRSeed] = React.useState(Math.floor(Math.random() * 1000));

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rName.trim() || !rEmail.trim() || rPass.length < 4) {
      toast.error("Please fill all fields", { description: "Password needs at least 4 characters." });
      return;
    }
    setShowPledge(true);
  };

  const acceptPledge = async () => {
    const res = await signUp({ username: rName.trim(), email: rEmail.trim(), password: rPass, avatarSeed: rSeed });
    if (!res.ok) {
      toast.error(res.error ?? "Could not create account");
      setShowPledge(false);
      return;
    }
    setShowPledge(false);
    toast.success("Welcome to the crowd", { description: "Your account is ready." });
    navigate("home");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn(loginEmail.trim(), loginPass);
    if (!res.ok) {
      toast.error(res.error ?? "Sign in failed");
      return;
    }
    toast.success("Welcome back");
    navigate("home");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-primary/20 text-primary">
          <Music className="size-6" />
        </div>
        <h1 className="logo-glow text-2xl font-bold">In the Crowd</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Somewhere, We're All in the Crowd.
        </p>
        {message && (
          <p className="mt-3 rounded-lg border border-primary/30 bg-primary/10 p-2 text-sm text-primary">
            {message}
          </p>
        )}
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "register")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login" className="gap-1.5">
            <LogIn className="size-4" /> Sign in
          </TabsTrigger>
          <TabsTrigger value="register" className="gap-1.5">
            <UserPlus className="size-4" /> Create account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Welcome back</CardTitle>
              <CardDescription>Sign in with your email and password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="le">Email</Label>
                  <Input id="le" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lp">Password</Label>
                  <Input id="lp" type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="••••••" required />
                </div>
                <Button type="submit" className="w-full">Sign in</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Join the crowd</CardTitle>
              <CardDescription>
                First registered account becomes admin (for demo moderation access).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rn">Username</Label>
                  <Input id="rn" value={rName} onChange={(e) => setRName(e.target.value)} placeholder="your stage name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="re">Email</Label>
                  <Input id="re" type="email" value={rEmail} onChange={(e) => setREmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rp">Password</Label>
                  <Input id="rp" type="password" value={rPass} onChange={(e) => setRPass(e.target.value)} placeholder="at least 4 characters" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Avatar</Label>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback style={{ background: avatarGradient(rSeed), color: "#0A1228" }} className="font-bold">
                        {avatarInitials(rName || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <Button type="button" variant="outline" size="sm" onClick={() => setRSeed(Math.floor(Math.random() * 1000))}>
                      Shuffle
                    </Button>
                    <Badge variant="secondary">seed #{rSeed}</Badge>
                  </div>
                </div>
                <Button type="submit" className="w-full">Continue to pledge</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Demo authentication — client-side only. No real security. Your first registered account becomes the admin.
      </p>

      <PledgeDialog
        open={showPledge}
        onOpenChange={setShowPledge}
        onAccept={acceptPledge}
        onCancel={() => setShowPledge(false)}
      />
    </div>
  );
}
