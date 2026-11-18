"use client";

import * as React from "react";
import { useStore, type ConcertSeed } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Shield, Eye } from "lucide-react";
import { coverClass, formatConcertDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function ConcertCard({
  concert,
  compact,
}: {
  concert: ConcertSeed;
  compact?: boolean;
}) {
  const { navigate, toggleSpoilerShield, spoilerShields, gentleMode } = useStore();
  const shielded = spoilerShields.includes(concert.id);

  return (
    <article
      className={cn("polaroid group flex flex-col overflow-hidden rounded-xl p-0", compact ? "min-w-[220px]" : "")}
      onClick={() => navigate("concert-detail", { concertId: concert.id })}
      role="button"
      tabIndex={0}
    >
      <div className={cn("relative w-full overflow-hidden", coverClass(concert.coverIndex), compact ? "h-32" : "h-40")}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          {concert.unverified && (
            <Badge variant="secondary" className="bg-black/40 text-white backdrop-blur">
              Added by a fan
            </Badge>
          )}
          {concert.past && (
            <Badge className="bg-black/40 text-white backdrop-blur">Past show</Badge>
          )}
          {concert.createdByUsername && (
            <Badge variant="secondary" className="bg-black/40 text-white backdrop-blur">
              Started
            </Badge>
          )}
        </div>
        {shielded && (
          <div className="absolute right-3 top-3">
            <Badge className="bg-black/40 text-white backdrop-blur">
              <Shield className="size-3" /> Shielded
            </Badge>
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">{concert.tour}</p>
          <p className="text-lg font-bold leading-tight">{concert.artist}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3" /> {formatConcertDate(concert.date)}
          </span>
          {concert.city && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> {concert.city}
            </span>
          )}
        </div>
        {concert.venue && <p className="text-xs text-muted-foreground">{concert.venue}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-muted-foreground">
            {gentleMode
              ? "Many in the crowd"
              : `${concert.libraryCount.photos + concert.libraryCount.videos} memories`}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              toggleSpoilerShield(concert.id);
            }}
            className="h-7 px-2 text-xs"
          >
            <Eye className="size-3" />
            {shielded ? "Unshield" : "Shield"}
          </Button>
        </div>
      </div>
    </article>
  );
}
