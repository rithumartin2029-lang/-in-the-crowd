"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { CircleHelp, X, Compass, Users, Images, MessageCircle } from "lucide-react";

const GUIDES: Record<string,string> = {
  stories: "Choose a photo or video, select who can see it, then tap Share story. It stays up for 24 hours.",
  memories: "Choose a concert first. Its library has tabs for photos, videos, song moments and highlights. Use Upload to add a memory.",
  tickets: "Choose a concert space, add an optional seat or note, then create your keepsake. It is not an entry ticket.",
  "crowd-chat": "Open a conversation with an accepted FOMO Buddy or Concert Buddy. If nobody appears, visit Connections first.",
  connections: "Follow is one-way and separate from buddy requests. Private chat is available after a FOMO or Concert Buddy request is accepted.",
  together: "Choose a concert room to join the conversation. Each room belongs to one concert space.",
  explore: "Search for an artist or concert, open a result, then use the concert page to join its community.",
  community: "Share a thought with the FOMO Wall. Keep posts kind and report anything that doesn't feel right.",
};
export function HelpGuide() {
  const { view, navigate } = useStore();
  const [open,setOpen]=React.useState(false);
  const tip=GUIDES[view]??"Choose a section from the navigation. If something is missing, check that you're signed in and try refreshing the page.";
  return <div className="fixed bottom-[calc(5.8rem+env(safe-area-inset-bottom))] right-3 z-50 lg:bottom-5 lg:right-5">
    {open&&<div className="mb-2 w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl border border-primary/25 bg-card p-4 shadow-2xl">
      <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">Need a hand?</p><button onClick={()=>setOpen(false)} aria-label="Close help"><X className="size-4"/></button></div>
      <p className="text-sm leading-relaxed text-muted-foreground">{tip}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" onClick={()=>{navigate("explore");setOpen(false);}}><Compass className="mr-1 size-3.5"/> Explore</Button>
        <Button size="sm" variant="outline" onClick={()=>{navigate("connections");setOpen(false);}}><Users className="mr-1 size-3.5"/> Connections</Button>
        <Button size="sm" variant="outline" onClick={()=>{navigate("memories");setOpen(false);}}><Images className="mr-1 size-3.5"/> Memories</Button>
        <Button size="sm" variant="outline" onClick={()=>{navigate("crowd-chat");setOpen(false);}}><MessageCircle className="mr-1 size-3.5"/> Chat</Button>
      </div>
    </div>}
    <Button onClick={()=>setOpen(v=>!v)} size="sm" className="gap-2 rounded-full shadow-lg shadow-primary/25"><CircleHelp className="size-4"/>{open?"Close help":"Need a hand?"}</Button>
  </div>;
}
