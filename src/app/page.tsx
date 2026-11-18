"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Header } from "@/components/site/Header";
import { BottomNav } from "@/components/site/BottomNav";
import { Footer } from "@/components/site/Footer";
import { GentleBanner } from "@/components/site/GentleBanner";
import { AnimatePresence, motion } from "framer-motion";

import Home from "@/components/site/pages/Home";
import Explore from "@/components/site/pages/Explore";
import ConcertDetail from "@/components/site/pages/ConcertDetail";
import Community from "@/components/site/pages/Community";
import { Together } from "@/components/site/pages/Together";
import MySpace from "@/components/site/pages/MySpace";
import Auth from "@/components/site/pages/Auth";
import Notifications from "@/components/site/pages/Notifications";
import Settings from "@/components/site/pages/Settings";
import FounderStory from "@/components/site/pages/FounderStory";
import TakedownRequest from "@/components/site/pages/TakedownRequest";
import Admin from "@/components/site/pages/Admin";
import BucketList from "@/components/site/pages/BucketList";
import Countdown from "@/components/site/pages/Countdown";
import UntilImThere from "@/components/site/pages/UntilImThere";
import Connections from "@/components/site/pages/Connections";
import ArtistCommunity from "@/components/site/pages/ArtistCommunity";
import { StartSpaceDialog } from "@/components/site/StartSpaceDialog";

const AUTH_REQUIRED = new Set([
  "myspace",
  "settings",
  "notifications",
  "admin",
  "connections",
  "bucket-list",
  "countdown",
  "until-im-there",
]);

function renderView(view: string, authed: boolean) {
  if (AUTH_REQUIRED.has(view) && !authed) {
    return <Auth message="Sign in to continue — somewhere, we're all in the crowd." />;
  }
  switch (view) {
    case "home": return <Home />;
    case "explore": return <Explore />;
    case "concert-detail": return <ConcertDetail />;
    case "community": return <Community />;
    case "together": return <Together />;
    case "myspace": return <MySpace />;
    case "notifications": return <Notifications />;
    case "settings": return <Settings />;
    case "founder-story": return <FounderStory />;
    case "takedown": return <TakedownRequest />;
    case "admin": return <Admin />;
    case "bucket-list": return <BucketList />;
    case "countdown": return <Countdown />;
    case "until-im-there": return <UntilImThere />;
    case "connections": return <Connections />;
    case "artist-community": return <ArtistCommunity />;
    case "auth": return <Auth />;
    default: return <Home />;
  }
}

export default function Page() {
  const { view, auth, gentleMode, setView, restoreSession } = useStore();
  // Guard against SSR/CSR hydration mismatch caused by Zustand persist
  // reading localStorage on the client only. We render a neutral shell on
  // the server and on the first client render, then swap in the real view.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    // Manually rehydrate from localStorage now that we're on the client.
    try {
      useStore.persist.rehydrate();
    } catch {}
    setMounted(true);
    // If Supabase is configured, also try to restore the user's session
    // (so a refresh keeps them signed in) and load their data.
    restoreSession().catch(() => {});
  }, [restoreSession]);

  // Deep-link from PWA manifest shortcuts: /?view=explore / together / myspace
  React.useEffect(() => {
    if (!mounted) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qView = params.get("view");
    if (!qView) return;
    const allowed = new Set([
      "home", "explore", "community", "together", "myspace",
      "notifications", "founder-story", "takedown", "auth",
      "bucket-list", "countdown", "until-im-there", "connections",
    ]);
    if (allowed.has(qView)) {
      setView(qView);
      // Clean the URL so a refresh doesn't keep forcing the same view.
      try {
        const clean = window.location.pathname + window.location.hash;
        window.history.replaceState({}, "", clean);
      } catch {}
    }
  }, [mounted, setView]);

  // sync theme class on mount
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.classList.toggle("gentle", gentleMode);
    }
  }, [gentleMode]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <GentleBanner />
      <main className="flex-1 pb-24 lg:pb-0">
        {mounted ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={view + (auth?.id ?? "guest")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {renderView(view, !!auth)}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded bg-muted/60" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted/40" />
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-40 animate-pulse rounded-lg bg-muted/30" />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
      <StartSpaceDialog />
    </div>
  );
}
