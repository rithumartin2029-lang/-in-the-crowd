"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Home, Compass, Users, MessageCircle, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "home", label: "Home", icon: Home },
  { key: "explore", label: "Explore", icon: Compass },
  { key: "add", label: "Add", icon: Plus, center: true },
  { key: "community", label: "Community", icon: MessageCircle },
  { key: "myspace", label: "Me", icon: User },
];

export function BottomNav() {
  const { view, navigate, auth, setStartSpaceOpen } = useStore();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/90 backdrop-blur-xl lg:hidden"
      aria-label="Mobile navigation"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITEMS.map((item) => {
          if (item.center) {
            return (
              <button
                key={item.key}
                onClick={() => {
                  if (!auth) {
                    navigate("auth");
                    return;
                  }
                  setStartSpaceOpen(true);
                }}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
                aria-label={item.label}
              >
                <span className="grid size-12 -translate-y-3 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <item.icon className="size-6" />
                </span>
              </button>
            );
          }
          const active = view === item.key || (item.key === "myspace" && view === "myspace");
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium min-h-[44px]",
                active ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={item.label}
            >
              <item.icon className={cn("size-5", active && "drop-shadow-[0_0_6px_var(--primary)]")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
