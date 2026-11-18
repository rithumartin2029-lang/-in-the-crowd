"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA boot:
 *  1. Registers /sw.js so the site is installable and works offline.
 *  2. Listens for `beforeinstallprompt` and shows a small "Install app"
 *     banner so Android/desktop Chrome users can add it to their home screen.
 *  3. Detects when the app is running in standalone mode (already installed)
 *     and hides the banner in that case.
 *
 * On iOS Safari there's no `beforeinstallprompt` event — iOS users need to
 * tap Share → "Add to Home Screen" manually. We show a small one-time hint
 * for iOS Safari in that case.
 */
export function PWABoot() {
  const [installEvent, setInstallEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = React.useState(false);
  const [iosHint, setIosHint] = React.useState(false);

  // Register the service worker on mount.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // console.info("[PWA] service worker registered", reg.scope);
        })
        .catch((err) => {
          // Registration failures are non-fatal — the site still works.
          // console.warn("[PWA] service worker registration failed", err);
        });
    };

    // Use window.load if it hasn't fired yet; otherwise register now.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  // Detect iOS Safari (no beforeinstallprompt event there).
  const isIosSafari = React.useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const webkit = /webkit/i.test(ua);
    const chrome = /crios|fxios/i.test(ua);
    return ios && webkit && !chrome;
  }, []);

  const isStandalone = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      // iOS Safari standalone
      (window.navigator as any).standalone === true
    );
  }, []);

  React.useEffect(() => {
    if (isStandalone) return; // already installed

    const dismissedAt = Number(localStorage.getItem("itc-install-dismissed") ?? 0);
    const dayMs = 24 * 60 * 60 * 1000;
    const recentlyDismissed = Date.now() - dismissedAt < dayMs;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      if (!recentlyDismissed) setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS hint (only if not recently dismissed).
    if (isIosSafari && !recentlyDismissed) {
      const t = setTimeout(() => setIosHint(true), 4000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, [isIosSafari, isStandalone]);

  const doInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
      setIosHint(false);
    }
    setInstallEvent(null);
  };

  const dismiss = () => {
    setShowBanner(false);
    setIosHint(false);
    try {
      localStorage.setItem("itc-install-dismissed", String(Date.now()));
    } catch {}
  };

  if (isStandalone) return null;

  // Android / desktop Chrome — install prompt available.
  if (showBanner && installEvent) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 px-2 lg:bottom-6 lg:left-6 lg:translate-x-0 lg:px-0">
        <Card className="border-primary/40 bg-card/95 shadow-xl backdrop-blur-xl lg:mb-20">
          <CardContent className="flex items-center gap-3 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
              <Download className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Install In the Crowd</p>
              <p className="text-xs text-muted-foreground">
                Add it to your home screen — opens like an app, works offline.
              </p>
            </div>
            <Button size="sm" onClick={doInstall} className="shrink-0 gap-1.5">
              <Sparkles className="size-3.5" /> Install
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={dismiss}
              className="shrink-0 px-2"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // iOS Safari — explain how to add to home screen manually.
  if (iosHint) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 px-2 lg:bottom-6 lg:left-6 lg:translate-x-0 lg:px-0">
        <Card className="border-primary/40 bg-card/95 shadow-xl backdrop-blur-xl lg:mb-20">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                <Download className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Add to Home Screen</p>
                <p className="text-xs text-muted-foreground">
                  Tap the Share icon, then &ldquo;Add to Home Screen&rdquo; to install In the Crowd as an app.
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={dismiss}
                className="shrink-0 px-2"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
