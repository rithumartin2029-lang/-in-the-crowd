"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/site/EmptyState";
import { Section } from "@/components/site/Section";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users, Flag, Lock } from "lucide-react";
import { toast } from "sonner";
import { timeAgo } from "@/lib/utils";

type ChatRow = { id:string; user_a:string; user_b:string; created_at:string };
type MessageRow = { id:string; chat_id:string; sender_id:string; body:string; created_at:string };

export default function CrowdChat() {
  const { auth, connections, registeredUsers, loadFromSupabase, liveMode, reportContent, navigate } = useStore();
  const [chats,setChats]=React.useState<ChatRow[]>([]);
  const [selected,setSelected]=React.useState<ChatRow|null>(null);
  const [messages,setMessages]=React.useState<MessageRow[]>([]);
  const [draft,setDraft]=React.useState("");
  const [loading,setLoading]=React.useState(true);
  const [sending,setSending]=React.useState(false);
  const acceptedIds=React.useMemo(()=>[...new Set([
    ...connections.fomo.filter(x=>x.status==="accepted").map(x=>x.userId),
    ...connections.buddies.filter(x=>x.status==="accepted").map(x=>x.userId),
  ])],[connections]);
  const contacts=registeredUsers.filter(u=>acceptedIds.includes(u.id)&&u.id!==auth?.id);

  const loadChats=React.useCallback(async()=>{
    if(!supabase||!auth){setChats([]);setLoading(false);return;}
    setLoading(true);
    const {data,error}=await supabase.from("direct_chats").select("*").or(`user_a.eq.${auth.id},user_b.eq.${auth.id}`).order("created_at",{ascending:false});
    if(error) toast.error("Your chats couldn't load. Please refresh.");
    setChats((data??[]) as ChatRow[]);setLoading(false);
  },[auth?.id]);

  React.useEffect(()=>{
    let alive=true;
    const start=async()=>{if(liveMode) await loadFromSupabase();if(alive) await loadChats();};
    void start();
    return()=>{alive=false;};
  },[loadChats,loadFromSupabase,liveMode]);

  const otherId=(chat:ChatRow)=>chat.user_a===auth?.id?chat.user_b:chat.user_a;
  const userFor=(id:string)=>registeredUsers.find(u=>u.id===id);

  const openWith=async(userId:string)=>{
    if(!auth||!supabase)return;
    const [a,b]=[auth.id,userId].sort();
    let {data,error}=await supabase.from("direct_chats").select("*").eq("user_a",a).eq("user_b",b).maybeSingle();
    if(error){toast.error("Couldn't open this chat.");return;}
    if(!data){
      const result=await supabase.from("direct_chats").insert({user_a:a,user_b:b}).select("*").single();
      data=result.data;error=result.error;
      if(error&&!data){
        const retry=await supabase.from("direct_chats").select("*").eq("user_a",a).eq("user_b",b).maybeSingle();
        data=retry.data;
      }
    }
    if(!data){toast.error("Chat is available only with an accepted FOMO or Concert Buddy connection.");return;}
    const row=data as ChatRow;setSelected(row);setMessages([]);
    setChats((old)=>[row,...old.filter(x=>x.id!==row.id)]);
  };

  React.useEffect(()=>{
    if(!selected||!supabase){setMessages([]);return;}
    let alive=true;
    const fetchMessages=async()=>{
      const {data,error}=await supabase!.from("direct_messages").select("*").eq("chat_id",selected.id).order("created_at",{ascending:true});
      if(error){toast.error("Messages couldn't load.");return;}
      if(alive)setMessages((data??[]) as MessageRow[]);
    };
    void fetchMessages();
    const channel=supabase.channel(`direct-chat-${selected.id}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"direct_messages",filter:`chat_id=eq.${selected.id}`},(payload)=>{
        const row=payload.new as MessageRow;
        setMessages(old=>old.some(m=>m.id===row.id)?old:[...old,row]);
      }).subscribe();
    return()=>{alive=false;void supabase!.removeChannel(channel);};
  },[selected?.id]);

  const send=async()=>{
    if(!auth||!supabase||!selected||!draft.trim()||sending)return;
    setSending(true);
    const {data,error}=await supabase.from("direct_messages").insert({chat_id:selected.id,sender_id:auth.id,body:draft.trim()}).select("*").single();
    setSending(false);
    if(error){toast.error("Message not sent. Make sure you're still connected.");return;}
    setMessages(old=>old.some(m=>m.id===data.id)?old:[...old,data as MessageRow]);setDraft("");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <Section title="Crowd Chat" description="A quieter space for one-to-one conversations with your accepted FOMO and Concert Buddies.">{null}</Section>
      {!supabase || !liveMode ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Private chat needs a live account connection. Sign in on the published website to use Crowd Chat.</CardContent></Card> :
      <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="min-h-[520px] bg-card/70">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="size-4 text-primary"/> Your crowd</CardTitle><CardDescription>Only accepted connections can message you.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start a chat</p>
              {contacts.length===0?<p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">You don't have a buddy connection yet. Add a FOMO or Concert Buddy first.</p>:
              <div className="max-h-44 space-y-1 overflow-y-auto">{contacts.map(u=><button key={u.id} onClick={()=>void openWith(u.id)} className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-primary/10"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{u.username.slice(0,2).toUpperCase()}</span><span className="truncate text-sm">{u.username}</span><MessageCircle className="ml-auto size-4 text-muted-foreground"/></button>)}</div>}
            </div>
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent chats</p>
              {loading?<p className="text-xs text-muted-foreground">Loading…</p>:chats.length===0?<p className="text-xs text-muted-foreground">Your conversations will appear here.</p>:
              <div className="max-h-52 space-y-1 overflow-y-auto">{chats.map(c=>{const u=userFor(otherId(c));return <button key={c.id} onClick={()=>{setSelected(c);setMessages([]);}} className={`flex w-full items-center gap-2 rounded-lg p-2 text-left ${selected?.id===c.id?"bg-primary/15":"hover:bg-muted/70"}`}><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{(u?.username??"C").slice(0,2).toUpperCase()}</span><span className="truncate text-sm">{u?.username??"Crowd member"}</span></button>})}</div>}
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground"><Lock className="mt-0.5 size-3.5 shrink-0 text-primary"/> Messages are private to the two people in the chat. If you disconnect, new messages are blocked.</div>
          </CardContent>
        </Card>
        <Card className="flex min-h-[520px] flex-col bg-card/70">
          {selected ? <>
            <CardHeader className="border-b border-border/50"><CardTitle className="text-base">{userFor(otherId(selected))?.username??"Crowd member"}</CardTitle><CardDescription>Private conversation</CardDescription></CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-muted/20 p-3">
                {messages.length===0?<EmptyState title="Say hello" message="Start with a kind message. Your conversation is private."/>:messages.map(m=><div key={m.id} className={`flex ${m.sender_id===auth?.id?"justify-end":"justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-3 py-2 ${m.sender_id===auth?.id?"bg-primary text-primary-foreground":"bg-muted"}`}><p className="whitespace-pre-wrap break-words text-sm">{m.body}</p><p className={`mt-1 text-[10px] ${m.sender_id===auth?.id?"text-primary-foreground/70":"text-muted-foreground"}`}>{timeAgo(m.created_at)}</p></div></div>)}
              </div>
              <div className="flex gap-2"><Input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}} maxLength={2000} placeholder="Write a message…" /><Button onClick={()=>void send()} disabled={!draft.trim()||sending}><Send className="size-4"/></Button></div>
              <p className="text-[11px] text-muted-foreground">Be kind. You can report a message if something feels wrong.</p>
              {messages.length>0&&<button onClick={()=>{const last=messages[messages.length-1];void reportContent({reporterId:auth?.id??"anon",targetType:"direct_message",targetId:last.id,reason:"Reported from Crowd Chat"});toast.success("Latest message reported for review.");}} className="self-start text-xs text-muted-foreground hover:text-destructive"><Flag className="mr-1 inline size-3"/>Report latest message</button>}
            </CardContent>
          </> : <CardContent className="flex flex-1 items-center justify-center p-8"><EmptyState title="Your next conversation starts here" message="Choose someone from your accepted connections to open a private chat."/></CardContent>}
        </Card>
      </div>}
    </div>
  );
}
