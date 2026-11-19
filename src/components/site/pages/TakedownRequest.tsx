"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export default function TakedownRequest() {
  const { auth, reportContent } = useStore();
  const [name, setName] = React.useState(auth?.username ?? "");
  const [role, setRole] = React.useState("artist");
  const [target, setTarget] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !target.trim() || !reason.trim()) {
      toast.error("Please complete the form");
      return;
    }
    setSubmitting(true);
    const result = await reportContent({
      reporterId: auth?.id ?? "",
      targetType: "takedown",
      targetId: target.trim(),
      reason: `${role} — ${name.trim()}: ${reason.trim()}`,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error("Request could not be submitted", { description: result.error ?? "Please try again." });
      return;
    }
    toast.success("Request received", { description: "Your request has been sent to the moderation team." });
    setTarget("");
    setReason("");
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
          <Shield className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Takedown request</h1>
          <p className="text-sm text-muted-foreground">
            For artists, organizers, and rights holders.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submit a request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name or representative" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="artist">Artist / band member</SelectItem>
                  <SelectItem value="organizer">Organizer / venue</SelectItem>
                  <SelectItem value="rights">Rights holder</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target">Content URL or ID</Label>
              <Input id="target" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Memory ID, post URL, or concert page" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us what's wrong. We'll take it seriously." rows={4} required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Submitting…" : "Submit request"}</Button>
            <p className="text-center text-xs text-muted-foreground">
              You do not need an account. Requests are securely sent to the administrator for review.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
