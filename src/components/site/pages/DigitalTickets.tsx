"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/site/EmptyState";
import { Section } from "@/components/site/Section";
import { Badge } from "@/components/ui/badge";
import { Ticket, Trash2, Sparkles, CalendarDays, MapPin } from "lucide-react";
import { toast } from "sonner";

type TicketRow = { id:string; user_id:string; concert_id:string|null; artist:string; event_name:string; event_date:string; venue:string; city:string; seat_info:string; ticket_code:string; note:string; created_at:string };

export default function DigitalTickets() {
  const { auth, concerts, navigate } = useStore();
  const [tickets, setTickets] = React.useState<TicketRow[]>([]);
  const [concertId, setConcertId] = React.useState("");
  const [seat, setSeat] = React.useState("");
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadTickets = React.useCallback(async () => {
    if (!supabase || !auth) { setTickets([]); setLoading(false); return; }
    const { data, error } = await supabase.from("digital_tickets").select("*").order("created_at", { ascending:false });
    if (error) toast.error("Your ticket keepsakes couldn't load.");
    setTickets((data ?? []) as TicketRow[]); setLoading(false);
  }, [auth?.id]);
  React.useEffect(() => { void loadTickets(); }, [loadTickets]);

  const createTicket = async () => {
    if (!auth || !supabase) { navigate("auth"); return; }
    const concert = concerts.find((c) => c.id === concertId);
    if (!concert) { toast.error("Choose a concert first."); return; }
    setSaving(true);
    const code = `ITC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const { error } = await supabase.from("digital_tickets").insert({
      user_id: auth.id, concert_id: concert.id, artist: concert.artist, event_name: concert.tour || concert.artist,
      event_date: concert.date || "", venue: concert.venue || "", city: concert.city || "", seat_info: seat.trim(),
      ticket_code: code, note: note.trim(),
    });
    setSaving(false);
    if (error) { toast.error("Couldn't save your ticket. Please try again."); return; }
    setSeat(""); setNote(""); toast.success("Your concert keepsake ticket is ready."); await loadTickets();
  };

  const deleteTicket = async (id:string) => {
    if (!supabase) return;
    const { error } = await supabase.from("digital_tickets").delete().eq("id",id);
    if (error) { toast.error("Couldn't delete this ticket."); return; }
    setTickets((items) => items.filter((item) => item.id !== id)); toast.success("Ticket removed.");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <Section title="Digital Tickets" description="Turn a concert you love into a little ticket-shaped keepsake you can keep forever." />
      <Card className="border-primary/25 bg-gradient-to-br from-primary/10 via-card to-accent/10">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-primary" /> Create a Crowd Pass</CardTitle><CardDescription>Choose one of your concert spaces and add a seat or personal note.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {concerts.length === 0 ? <><EmptyState title="No concert spaces yet" message="Explore or start a concert space before making a keepsake ticket." /><div className="flex justify-center"><Button onClick={() => navigate("explore")}>Explore concerts</Button></div></> : <>
            <select value={concertId} onChange={(e)=>setConcertId(e.target.value)} className="min-h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="">Choose a concert…</option>{concerts.map((c)=><option key={c.id} value={c.id}>{c.artist} · {c.tour}</option>)}
            </select>
            <input value={seat} onChange={(e)=>setSeat(e.target.value)} maxLength={80} placeholder="Seat / section (optional)" className="min-h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
            <textarea value={note} onChange={(e)=>setNote(e.target.value)} maxLength={180} placeholder="A note about the night (optional)" className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <Button onClick={()=>void createTicket()} disabled={saving || !concertId} className="gap-2"><Ticket className="size-4" /> {saving ? "Creating…" : "Create keepsake ticket"}</Button>
          </>}
          <p className="text-xs text-muted-foreground">These are personal keepsakes, not venue-issued tickets and not valid for event entry.</p>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Your ticket collection</h2><Badge variant="secondary">{tickets.length} saved</Badge></div>
      {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading your tickets…</p> : tickets.length === 0 ? <EmptyState title="Your first Crowd Pass is waiting" message="Make a ticket keepsake for a night you never want to forget." /> :
        <div className="grid gap-4 md:grid-cols-2">
          {tickets.map((t)=> <Card key={t.id} className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white shadow-lg">
            <CardContent className="p-0">
              <div className="flex items-start justify-between gap-3 p-5"><div><p className="text-[10px] uppercase tracking-[0.22em] text-sky-200">In The Crowd · Crowd Pass</p><h3 className="mt-2 text-xl font-bold">{t.artist}</h3><p className="text-sm text-sky-100/80">{t.event_name}</p></div><Ticket className="size-8 text-sky-200" /></div>
              <div className="grid grid-cols-2 gap-3 px-5 pb-4 text-xs">
                <div><p className="text-sky-200/70">DATE</p><p className="mt-1 font-semibold">{t.event_date ? new Date(t.event_date).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}) : "Date to be announced"}</p></div>
                <div><p className="text-sky-200/70">SECTION / SEAT</p><p className="mt-1 font-semibold">{t.seat_info || "Your own spot"}</p></div>
                <div className="col-span-2"><p className="text-sky-200/70">VENUE</p><p className="mt-1 flex items-center gap-1 font-semibold"><MapPin className="size-3" /> {[t.venue,t.city].filter(Boolean).join(" · ") || "A night to remember"}</p></div>
              </div>
              {t.note && <p className="px-5 pb-4 text-xs italic text-sky-100/80">“{t.note}”</p>}
              <div className="border-t border-dashed border-sky-200/40 px-5 py-4">
                <div className="flex items-end justify-between gap-3"><div><p className="text-[9px] uppercase tracking-widest text-sky-200/70">Keepsake code</p><p className="font-mono text-sm font-bold tracking-wider">{t.ticket_code}</p></div><div className="flex h-9 items-end gap-[2px]" aria-hidden="true">{Array.from({length:34},(_,i)=><span key={i} className="w-[2px] rounded-t bg-sky-100/90" style={{height:`${12+((t.ticket_code.charCodeAt(i%t.ticket_code.length)+i*7)%22)}px`}} />)}</div></div>
                <div className="mt-3 flex justify-between text-[9px] text-sky-200/60"><span>KEEP THIS MEMORY CLOSE</span><button onClick={()=>void deleteTicket(t.id)} className="inline-flex items-center gap-1 hover:text-white"><Trash2 className="size-3" /> Remove</button></div>
              </div>
            </CardContent>
          </Card>)}
        </div>}
    </div>
  );
}
