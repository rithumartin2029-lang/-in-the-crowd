"use client";

import * as React from "react";
import { useStore, type MemoryCategory, type Memory } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/site/EmptyState";
import { SpoilerShield } from "@/components/site/SpoilerShield";
import { UploadDialog } from "./UploadDialog";
import { coverClass, timeAgo } from "@/lib/utils";
import { Search, Star, Upload, Heart, Flag, FolderPlus, Folder, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const TABS: { key: MemoryCategory; label: string }[] = [
  { key: "photos", label: "Photos" },
  { key: "videos", label: "Videos" },
  { key: "song-wise", label: "Song-wise" },
  { key: "special-moments", label: "Special moments" },
  { key: "audience", label: "Audience" },
  { key: "timeline", label: "Timeline" },
  { key: "favourite", label: "Favourites" },
  { key: "highlights", label: "Highlights" },
];

const SPOILER_CATEGORIES: MemoryCategory[] = ["song-wise", "special-moments"];

export function Library({ concertId }: { concertId: string }) {
  const { memories, memoryFolders, auth, spoilerShields, gentleMode, concerts, deleteMemory, reportContent, createMemoryFolder, renameMemoryFolder, deleteMemoryFolder, updateMemory } = useStore();
  const [tab, setTab] = React.useState<MemoryCategory>("photos");
  const [q, setQ] = React.useState("");
  const [favouritesOnly, setFavouritesOnly] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [favIds, setFavIds] = React.useState<string[]>([]);
  const [folderFilter, setFolderFilter] = React.useState("all");
  const myFolders = memoryFolders.filter((folder) => folder.concertId === concertId && folder.userId === auth?.id);

  const shielded = spoilerShields.includes(concertId);
  const concert = concerts.find((c) => c.id === concertId);

  const list = memories
    .filter((m) => m.concertId === concertId)
    .filter((m) => {
      if (auth && m.userId === auth.id) return true;
      if (m.visibility === "public") return m.approved;
      if (m.visibility === "connections" && auth) return true;
      return false;
    })
    .filter((m) => m.category === tab)
    .filter((m) => folderFilter === "all" || (folderFilter === "unfiled" ? !m.folderId : m.folderId === folderFilter))
    .filter((m) => (q.trim() ? `${m.caption} ${m.songName ?? ""} ${m.username}`.toLowerCase().includes(q.toLowerCase()) : true))
    .filter((m) => (favouritesOnly ? favIds.includes(m.id) : true));

  const toggleFav = (id: string) =>
    setFavIds((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  return (
    <div className="space-y-4">
      {auth && <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold"><Folder className="size-4 text-primary" /> My folders</div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={async () => { const name = window.prompt("Name your new folder"); if (!name?.trim()) return; const ok = await createMemoryFolder(concertId, name); ok ? toast.success("Folder created") : toast.error("Could not create folder. Try a different name."); }}><FolderPlus className="size-4" /> New folder</Button>
        </div>
        <Select value={folderFilter} onValueChange={setFolderFilter}>
          <SelectTrigger><SelectValue placeholder="All my memories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All memories</SelectItem>
            <SelectItem value="unfiled">Unfiled memories</SelectItem>
            {myFolders.map((folder) => <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {myFolders.length > 0 && <div className="flex flex-wrap gap-2">{myFolders.map((folder) => <div key={folder.id} className="flex items-center gap-1 rounded-full border border-border/50 px-2 py-1 text-xs"><Folder className="size-3 text-primary" />{folder.name}<button aria-label={`Rename ${folder.name}`} className="ml-1 text-muted-foreground hover:text-foreground" onClick={async () => { const name = window.prompt("Rename folder", folder.name); if (!name?.trim()) return; const ok = await renameMemoryFolder(folder.id, name); ok ? toast.success("Folder renamed") : toast.error("Could not rename folder."); }}><Pencil className="size-3" /></button><button aria-label={`Delete ${folder.name}`} className="text-muted-foreground hover:text-destructive" onClick={async () => { if (!window.confirm("Delete this folder? Your photos and videos will stay safe and become unfiled.")) return; const ok = await deleteMemoryFolder(folder.id); ok ? toast.success("Folder deleted; memories kept") : toast.error("Could not delete folder."); }}><Trash2 className="size-3" /></button></div>)}</div>}
        <p className="text-xs text-muted-foreground">Folders organise your own uploads. Deleting a folder never deletes its photos or videos.</p>
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this library..." className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={favouritesOnly ? "default" : "outline"} onClick={() => setFavouritesOnly((v) => !v)} className="gap-1.5">
            <Star className="size-4" /> Favourites
          </Button>
          <Button size="sm" onClick={() => { if (!auth) { toast.error("Sign in to upload"); return; } setUploadOpen(true); }} className="gap-1.5">
            <Upload className="size-4" /> Upload
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as MemoryCategory)}>
        <TabsList className="flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <EmptyState title="Nothing here yet" message={`No ${TABS.find((t) => t.key === tab)?.label.toLowerCase()} in this library yet. Be the first.`} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <MemoryTile
              key={m.id}
              memory={m}
              shielded={shielded}
              coverIndex={concert?.coverIndex ?? 1}
              favourite={favIds.includes(m.id)}
              onToggleFav={() => toggleFav(m.id)}
              canModerate={auth?.role === "admin"}
              canReport={!!auth && auth.id !== m.userId}
              onReport={async (reason) => {
                const result = await reportContent({ reporterId: auth?.id ?? "", targetType: "memory", targetId: m.id, reason });
                result.ok ? toast.success("Memory reported for review") : toast.error(result.error ?? "Could not submit report");
              }}
              isOwner={auth?.id === m.userId}
              folders={myFolders}
              onMove={(folderId) => updateMemory(m.id, { folderId: folderId === "unfiled" ? undefined : folderId })}
              onDelete={async () => {
                if (!window.confirm("Permanently remove this memory and its uploaded file?")) return;
                const removed = await deleteMemory(m.id);
                removed ? toast.success("Memory permanently removed") : toast.error("Could not remove this memory");
              }}
            />
          ))}
        </div>
      )}

      {auth && (
        <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} concertId={concertId} />
      )}
    </div>
  );
}

function MemoryTile({
  memory,
  folders,
  isOwner,
  onMove,
  shielded,
  coverIndex,
  favourite,
  onToggleFav,
  canModerate,
  canReport,
  onReport,
  onDelete,
}: {
  memory: Memory;
  folders: { id: string; name: string }[];
  isOwner: boolean;
  onMove: (folderId: string) => void;
  shielded: boolean;
  coverIndex: number;
  favourite: boolean;
  onToggleFav: () => void;
  canModerate?: boolean;
  canReport?: boolean;
  onReport?: (reason: string) => void;
  onDelete?: () => void;
}) {
  const needsShield = shielded && (memory.containsSpoilers || SPOILER_CATEGORIES.includes(memory.category) || Boolean(memory.songName));
  return (
    <article className="polaroid overflow-hidden rounded-xl p-0">
      <div className="relative">
        <SpoilerShield active={needsShield}>
          <div className={`relative h-36 w-full ${memory.url ? "" : coverClass(coverIndex)}`}>
            {memory.url ? (
              memory.type === "video" ? (
                <video src={memory.url} className="h-full w-full object-cover" controls />
              ) : (
                <img src={memory.url} alt={memory.caption} className="h-full w-full object-cover" />
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            )}
            <div className="absolute left-2 top-2 flex gap-1">
              <Badge className="bg-black/40 text-white backdrop-blur">{memory.type}</Badge>
              {memory.visibility !== "public" && (
                <Badge className="bg-black/40 text-white backdrop-blur">{memory.visibility}</Badge>
              )}
              {memory.containsSpoilers && (
                <Badge className="bg-accent/40 text-white backdrop-blur">spoiler</Badge>
              )}
            </div>
          </div>
        </SpoilerShield>
        <button
          onClick={onToggleFav}
          className={`absolute right-2 top-2 grid size-8 place-items-center rounded-full backdrop-blur transition-colors ${
            favourite ? "bg-primary text-primary-foreground" : "bg-black/40 text-white"
          }`}
          aria-label="Favourite"
        >
          <Heart className="size-4" fill={favourite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm line-clamp-3">{memory.caption}</p>
        {isOwner && <div className="mt-2">
          <Select value={memory.folderId ?? "unfiled"} onValueChange={onMove}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Organise in folder" /></SelectTrigger>
            <SelectContent><SelectItem value="unfiled">No folder</SelectItem>{folders.map((folder) => <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>}
        {memory.folderId && folders.find((folder) => folder.id === memory.folderId) && <p className="mt-1 flex items-center gap-1 text-xs text-primary"><Folder className="size-3" />{folders.find((folder) => folder.id === memory.folderId)?.name}</p>}
        {memory.songName && (
          <p className="mt-1 text-xs text-primary">♪ {memory.songName}</p>
        )}
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>by {memory.username}</span>
          <span>{timeAgo(memory.createdAt)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {canReport && onReport && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { const reason = window.prompt("Why are you reporting this memory?"); if (reason?.trim()) onReport(reason.trim()); }}>
              <Flag className="mr-1 size-3" /> Report
            </Button>
          )}
          {canModerate && onDelete && (
            <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={onDelete}>
              Remove permanently (admin)
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
