import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from env.
 * If either is missing (e.g. the project hasn't been connected to Supabase
 * yet, or you're running the demo locally), `supabase` is `null` and the app
 * falls back to "local-only mode" — Zustand persists data in localStorage,
 * so the site is still fully usable as a personal demo, it just isn't shared
 * across users.
 *
 * When both env vars are present, the app boots into "live mode": every
 * create/update/delete goes to Supabase, and other users see the same data.
 *
 * The footer shows a small "Local mode" / "Live mode" badge so you can tell
 * at a glance which mode you're in.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 5 },
    },
  }) : null;

export const isLiveMode = !!supabase;

/** Throws a friendly error if you try to use Supabase in local mode. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live mode."
    );
  }
  return supabase;
}
