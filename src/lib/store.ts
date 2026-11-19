"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import { seedConcerts, seedArtists, seedMemories, seedFomoPosts, seedTogetherMessages, seedNotifications } from "./seed";
import { supabase, isLiveMode } from "./supabase";

// ---------- TYPES ----------
export type Role = "user" | "admin";

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // demo only
  avatarSeed: number;
  bio: string;
  favArtists: string[];
  favSongs: string[];
  attended: string[]; // concert ids
  startedConcertIds: string[]; // concerts this user created ("spaces")
  joinedConcertIds: string[]; // concerts this user has joined
  buddyMode: boolean;
  pledgeAcceptedAt: string | null;
  role: Role;
}

export interface BucketItem {
  id: string;
  artist: string;
  concert: string;
  tour?: string;
  date?: string;
  venue?: string;
  city?: string;
  notes?: string;
  attended: boolean;
}

export interface CountdownItem {
  id: string;
  artist: string;
  concert: string;
  date: string;
  venue?: string;
  city?: string;
  notes?: string;
  imageUrl?: string;
  variant?: "minimal" | "artist-photo" | "concert-info" | "personal-card";
  sharedWith?: string[];
  ownerId?: string;
  ownerUsername?: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  body: string;
  date: string;
  imageUrls: string[];
}

export interface DreamSetlist {
  id: string;
  artist: string;
  opening: string;
  favorites: string[];
  special: string;
  closing: string;
  moment: string;
}

export interface FundContribution {
  amount: number;
  label: string;
  date: string;
}

export interface OneDayFund {
  goal: number;
  saved: number;
  contributions: FundContribution[];
}

export interface SomedayConcert {
  id: string;
  artist: string;
  concert: string;
  fulfilled: boolean;
}

export interface SongMadeNight {
  id: string;
  song: string;
  why: string;
}

export type MemoryType = "photo" | "video";
export type MemoryCategory =
  | "photos"
  | "videos"
  | "song-wise"
  | "special-moments"
  | "audience"
  | "timeline"
  | "favourite"
  | "highlights";
export type Visibility = "public" | "connections" | "private";

export interface Memory {
  id: string;
  concertId: string;
  userId: string;
  username: string;
  type: MemoryType;
  url: string;
  storagePath?: string;
  caption: string;
  songName?: string;
  category: MemoryCategory;
  visibility: Visibility;
  containsSpoilers: boolean;
  approved: boolean;
  createdAt: string;
  folderId?: string;
}

export interface MemoryFolder {
  id: string;
  userId: string;
  concertId: string;
  name: string;
  createdAt: string;
}

export interface FomoComment {
  id: string;
  userId: string;
  username: string;
  body: string;
  replies: FomoComment[];
}

export interface FomoPost {
  id: string;
  userId: string;
  username: string;
  body: string;
  concertId?: string;
  artistId?: string;
  reactions: { heart: number; relatable: number; cry: number };
  comments: FomoComment[];
  createdAt: string;
}

export interface TogetherMessage {
  id: string;
  concertId: string;
  userId: string;
  username: string;
  text: string;
  type: "chat" | "song-update" | "pulse";
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: "fomo" | "memory" | "buddy" | "system" | "spoiler";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  spoilerSafe: boolean;
}

export interface Settings {
  profileVisible: boolean;
  showAttended: boolean;
  showBucketList: boolean;
  showMemories: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  customMuteList: string[];
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: "pending" | "reviewing" | "resolved";
}

export type ConnectionStatus = "pending" | "accepted" | "declined";
export type ConnectionKind = "fomo" | "buddy";
export interface ConnectionLink {
  userId: string;
  status: ConnectionStatus;
  direction: "incoming" | "outgoing";
  label?: string;
}
export interface Connections {
  fomo: ConnectionLink[];
  buddies: ConnectionLink[];
}
export interface FollowLink {
  userId: string;
  direction: "follower" | "following";
}

export interface ConcertSeed {
  id: string;
  artist: string;
  tour: string;
  date: string; // ISO, may be empty string for unscheduled
  venue: string;
  city: string;
  coverIndex: number;
  unverified: boolean;
  libraryCount: { photos: number; videos: number; songWise: number };
  past: boolean;
  notes?: string;
  // User-created space metadata:
  createdById?: string;
  createdByUsername?: string;
  createdAt?: string;
  visibility?: Visibility; // defaults to "public" so others can join
}

export interface ArtistSeed {
  id: string;
  name: string;
  genre: string;
  coverIndex: number;
  members: number;
}

// ---------- STORE ----------
interface StoreState {
  hydrated: boolean;
  auth: User | null;
  registeredUsers: User[];
  view: string;
  selectedConcertId: string | null;
  selectedArtistId: string | null;
  selectedUserId: string | null;
  theme: string;
  gentleMode: boolean;
  gentleUntil: number | null;
  spoilerShields: string[];
  gentleMutedArtists: string[];
  quietHours: { start: string; end: string };

  concerts: ConcertSeed[];
  artists: ArtistSeed[];

  bucketList: BucketItem[];
  countdowns: CountdownItem[];
  diary: DiaryEntry[];
  dreamSetlists: DreamSetlist[];
  oneDayFund: OneDayFund;
  somedayConcerts: SomedayConcert[];
  songThatMadeMyNight: SongMadeNight[];

  memories: Memory[];
  memoryFolders: MemoryFolder[];
  fomoPosts: FomoPost[];
  togetherMessages: TogetherMessage[];
  notifications: AppNotification[];

  connections: Connections;
  follows: FollowLink[];
  settings: Settings;
  reports: Report[];

  // UI state for the global Start-a-space dialog
  startSpaceOpen: boolean;
  setStartSpaceOpen: (v: boolean) => void;

  // Live mode (Supabase connected) vs local-only mode
  liveMode: boolean;
  loading: boolean;
  restoreSession: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;

  // Concert / space lifecycle
  addConcert: (input: {
    artist: string;
    tour: string;
    date?: string;
    venue?: string;
    city?: string;
    notes?: string;
    visibility?: Visibility;
  }) => string | null;
  joinConcert: (concertId: string) => void;
  leaveConcert: (concertId: string) => void;
  deleteConcert: (concertId: string) => void;

  // actions
  signUp: (data: { username: string; email: string; password: string; avatarSeed?: number }) => Promise<{ ok: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  resendSignupConfirmation: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signInDemo: () => void;
  signInDemoAdmin: () => void;
  signOut: () => Promise<void>;
  setView: (v: string) => void;
  navigate: (page: string, params?: Partial<{ concertId: string; artistId: string; userId: string }>) => void;

  toggleTheme: () => void;
  toggleGentleMode: (on?: boolean) => void;
  setGentleUntil: (ts: number | null) => void;
  toggleSpoilerShield: (concertId: string) => void;
  addGentleMutedArtist: (artist: string) => void;

  addBucketItem: (item: Omit<BucketItem, "id" | "attended">) => void;
  markBucketAttended: (id: string) => void;

  addCountdown: (c: Omit<CountdownItem, "id">, file?: File) => Promise<void>;
  editCountdown: (id: string, patch: Partial<CountdownItem>) => void;
  deleteCountdown: (id: string) => void;

  addDiary: (d: Omit<DiaryEntry, "id">) => void;
  deleteDiary: (id: string) => void;

  addDreamSetlist: (s: Omit<DreamSetlist, "id">) => void;
  addFundContribution: (c: Omit<FundContribution, "date">) => void;
  addSomeday: (s: Omit<SomedayConcert, "id" | "fulfilled">) => void;
  markSomedayFulfilled: (id: string) => void;
  addSongMadeNight: (s: Omit<SongMadeNight, "id">) => void;

  addMemory: (m: Omit<Memory, "id" | "createdAt">, file?: File) => Promise<void>;
  createMemoryFolder: (concertId: string, name: string) => Promise<boolean>;
  renameMemoryFolder: (folderId: string, name: string) => Promise<boolean>;
  deleteMemoryFolder: (folderId: string) => Promise<boolean>;
  updateMemory: (id: string, patch: Partial<Memory>) => void;
  deleteMemory: (id: string) => Promise<boolean>;

  addFomoPost: (p: Omit<FomoPost, "id" | "createdAt" | "reactions" | "comments">) => void;
  deleteFomoPost: (id: string) => Promise<boolean>;
  addFomoComment: (postId: string, body: string) => void;
  reactFomo: (postId: string, kind: keyof FomoPost["reactions"]) => void;

  sendConnectionRequest: (userId: string, kind: ConnectionKind) => Promise<boolean>;
  acceptConnection: (userId: string, kind: ConnectionKind) => Promise<boolean>;
  declineConnection: (userId: string, kind: ConnectionKind) => Promise<boolean>;
  followUser: (userId: string) => Promise<boolean>;
  unfollowUser: (userId: string) => Promise<boolean>;
  shareCountdown: (id: string, userIds: string[]) => Promise<boolean>;

  sendTogetherMessage: (m: Omit<TogetherMessage, "id" | "createdAt">) => void;
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  updateSettings: (s: Partial<Settings>) => void;
  updateProfile: (patch: Partial<User>) => void;
  reportContent: (r: Omit<Report, "id" | "status">) => Promise<{ ok: boolean; error?: string }>;
  updateReportStatus: (id: string, status: Report["status"]) => Promise<boolean>;
  blockUser: (userId: string) => void;

  resetAll: () => void;
}

const defaultSettings: Settings = {
  profileVisible: true,
  showAttended: true,
  showBucketList: true,
  showMemories: true,
  emailNotifications: true,
  pushNotifications: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  customMuteList: [],
};

const defaultFund: OneDayFund = {
  goal: 1500,
  saved: 0,
  contributions: [],
};

// ---------- DB row → app type helpers ----------
function profileToUser(p: any, email: string): User {
  return {
    id: String(p.id),
    username: p.username ?? "",
    email,
    password: "",
    avatarSeed: p.avatar_seed ?? 0,
    bio: p.bio ?? "",
    favArtists: p.fav_artists ?? [],
    favSongs: p.fav_songs ?? [],
    attended: [],
    startedConcertIds: [],
    joinedConcertIds: [],
    buddyMode: p.buddy_mode ?? false,
    pledgeAcceptedAt: p.pledge_accepted_at ?? null,
    role: p.role ?? "user",
  };
}

function dbConcertToSeed(c: any): ConcertSeed {
  return {
    id: String(c.id),
    artist: c.artist ?? "",
    tour: c.tour ?? "",
    date: c.date ?? "",
    venue: c.venue ?? "",
    city: c.city ?? "",
    coverIndex: c.cover_index ?? 1,
    unverified: c.unverified ?? true,
    libraryCount: c.library_count ?? { photos: 0, videos: 0, songWise: 0 },
    past: c.past ?? false,
    notes: c.notes ?? "",
    createdById: c.created_by ? String(c.created_by) : undefined,
    createdByUsername: c.created_by_username,
    createdAt: c.created_at,
    visibility: c.visibility ?? "public",
  };
}

function dbMemoryToMemory(m: any): Memory {
  return {
    id: String(m.id),
    concertId: String(m.concert_id ?? ""),
    userId: String(m.user_id ?? ""),
    username: m.username ?? "",
    type: m.type ?? "photo",
    url: m.url ?? "",
    storagePath: m.storage_path ?? undefined,
    caption: m.caption ?? "",
    songName: m.song_name,
    category: m.category ?? "photos",
    visibility: m.visibility ?? "public",
    containsSpoilers: m.contains_spoilers ?? false,
    approved: m.approved ?? false,
    createdAt: m.created_at ?? new Date().toISOString(),
    folderId: m.folder_id ? String(m.folder_id) : undefined,
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      auth: null,
      registeredUsers: [],
      view: "home",
      selectedConcertId: null,
      selectedArtistId: null,
      selectedUserId: null,
      theme: "dark",
      gentleMode: false,
      gentleUntil: null,
      spoilerShields: [],
      gentleMutedArtists: [],
      quietHours: { start: "22:00", end: "07:00" },

      // UI: global Start-a-space dialog
      startSpaceOpen: false,

      // Live mode (Supabase connected) — read from the supabase module once.
      liveMode: isLiveMode,
      loading: false,

      // Concerts, artists, memories, posts, messages and notifications all
      // start empty. Signed-in users create them via "Start a space".
      // In live mode, loadFromSupabase() hydrates these from the database.
      concerts: seedConcerts,
      artists: seedArtists,

      bucketList: [],
      countdowns: [],
      diary: [],
      dreamSetlists: [],
      oneDayFund: defaultFund,
      somedayConcerts: [],
      songThatMadeMyNight: [],
      memories: seedMemories,
      memoryFolders: [],
      fomoPosts: seedFomoPosts,
      togetherMessages: seedTogetherMessages,
      notifications: seedNotifications,
      connections: { fomo: [], buddies: [] },
      follows: [],
      settings: defaultSettings,
      reports: [],

      signUp: async ({ username, email, password, avatarSeed }) => {
        // LIVE MODE — use Supabase Auth. The handle_new_user trigger in
        // supabase/schema.sql auto-creates a profile row.
        if (supabase) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username, avatar_seed: avatarSeed ?? Math.floor(Math.random() * 1000) } },
          });
          if (error) {
            return { ok: false, error: error.message };
          }
          // Do not treat an unconfirmed signup as an authenticated session.
          // Supabase returns no session while email confirmation is pending.
          if (!data.session) {
            set({ auth: null });
            return { ok: true, needsEmailConfirmation: true };
          }
          // A real session exists, so it is safe to load the profile and enable writes.
          const userId = data.user?.id;
          if (userId) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .maybeSingle();
            if (profile) {
              const user: User = profileToUser(profile, email);
              set({ auth: user });
              get().loadFromSupabase();
              get().subscribeToRealtime();
              return { ok: true };
            }
            // Profile not yet visible (e.g. email unconfirmed) — set a
            // minimal user object so the UI knows who they are.
            set({
              auth: {
                id: userId,
                username,
                email,
                password: "",
                avatarSeed: avatarSeed ?? Math.floor(Math.random() * 1000),
                bio: "",
                favArtists: [],
                favSongs: [],
                attended: [],
                startedConcertIds: [],
                joinedConcertIds: [],
                buddyMode: false,
                pledgeAcceptedAt: new Date().toISOString(),
                role: "user",
              },
            });
          }
          return { ok: true };
        }

        // LOCAL FALLBACK — demo client-side auth (no real security)
        const existing = get().registeredUsers.find((u) => u.email === email);
        if (existing) return { ok: false, error: "An account with that email already exists." };
        const id = uuid();
        const isFirst = get().registeredUsers.length === 0;
        const user: User = {
          id,
          username,
          email,
          password,
          avatarSeed: avatarSeed ?? Math.floor(Math.random() * 1000),
          bio: "",
          favArtists: [],
          favSongs: [],
          attended: [],
          startedConcertIds: [],
          joinedConcertIds: [],
          buddyMode: false,
          pledgeAcceptedAt: new Date().toISOString(),
          role: isFirst ? "admin" : "user",
        };
        set({ auth: user, registeredUsers: [...get().registeredUsers, user] });
        return { ok: true };
      },

      resendSignupConfirmation: async (email) => {
        if (!supabase) return { ok: false, error: "Email confirmation is unavailable in local mode." };
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
        });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      },

      signIn: async (email, password) => {
        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return { ok: false, error: error.message };
          const userId = data.user?.id;
          if (!userId) return { ok: false, error: "Sign-in failed." };
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();
          if (profile) {
            const user: User = profileToUser(profile, email);
            set({ auth: user });
            await get().loadFromSupabase();
            get().subscribeToRealtime();
            return { ok: true };
          }
          return { ok: false, error: "Profile not found. Try again in a moment." };
        }
        // LOCAL FALLBACK
        const u = get().registeredUsers.find((x) => x.email === email && x.password === password);
        if (!u) return { ok: false, error: "Email or password is incorrect." };
        set({ auth: u });
        return { ok: true };
      },

      signInDemo: () => {
        // Local-only demo account (no Supabase). Disabled in live mode.
        const existing = get().registeredUsers.find((u) => u.email === "demo@concert.crowd");
        if (existing) {
          set({ auth: existing });
          return;
        }
        const user: User = {
          id: uuid(),
          username: "Demo Dreamer",
          email: "demo@concert.crowd",
          password: "demo",
          avatarSeed: 4242,
          bio: "Just here to dream a little.",
          favArtists: [],
          favSongs: [],
          attended: [],
          startedConcertIds: [],
          joinedConcertIds: [],
          buddyMode: false,
          pledgeAcceptedAt: new Date().toISOString(),
          role: "user",
        };
        set({ auth: user, registeredUsers: [...get().registeredUsers, user] });
      },

      signInDemoAdmin: () => {
        const existing = get().registeredUsers.find((u) => u.role === "admin");
        if (existing) {
          set({ auth: existing });
          return;
        }
        const user: User = {
          id: uuid(),
          username: "Demo Admin",
          email: "admin@concert.crowd",
          password: "admin",
          avatarSeed: 9999,
          bio: "Keeping the crowd kind.",
          favArtists: [],
          favSongs: [],
          attended: [],
          startedConcertIds: [],
          joinedConcertIds: [],
          buddyMode: false,
          pledgeAcceptedAt: new Date().toISOString(),
          role: "admin",
        };
        set({ auth: user, registeredUsers: [...get().registeredUsers, user] });
      },

      signOut: async () => {
        if (supabase) {
          await supabase.auth.signOut();
          get().unsubscribeFromRealtime();
        }
        set({ auth: null, view: "home", concerts: seedConcerts, artists: seedArtists, memories: seedMemories, fomoPosts: seedFomoPosts, togetherMessages: seedTogetherMessages, notifications: seedNotifications });
      },

      restoreSession: async () => {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session) {
          // Clear stale locally-persisted auth from signups that never confirmed.
          if (get().auth) set({ auth: null });
          return;
        }
        const userId = session.user.id;
        const email = session.user.email ?? "";
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        if (profile) {
          const user: User = profileToUser(profile, email);
          set({ auth: user });
          await get().loadFromSupabase();
          get().subscribeToRealtime();
        }
      },

      loadFromSupabase: async () => {
        if (!supabase) return;
        set({ loading: true });
        try {
          // Public data (visible to everyone, signed-in or not)
          const [{ data: concerts }, { data: artists }, { data: memories }, { data: fomoPosts }, { data: fomoComments }, { data: profiles }] = await Promise.all([
            supabase.from("concerts").select("*").order("created_at", { ascending: false }),
            supabase.from("artists").select("*").order("created_at", { ascending: false }),
            supabase.from("memories").select("*").order("created_at", { ascending: false }),
            supabase.from("fomo_posts").select("*").order("created_at", { ascending: false }),
            supabase.from("fomo_comments").select("*").order("created_at", { ascending: true }),
            supabase.from("profiles").select("*").order("created_at", { ascending: false }),
          ]);

          const hydratedMemories = await Promise.all((memories ?? []).map(async (m: any) => {
            let signedUrl = m.url ?? "";
            if (m.storage_path && supabase) {
              const { data } = await supabase.storage.from("memories").createSignedUrl(m.storage_path, 3600);
              signedUrl = data?.signedUrl ?? signedUrl;
            }
            return dbMemoryToMemory({ ...m, url: signedUrl });
          }));

          set({
            registeredUsers: (profiles ?? []).map((p: any) => profileToUser(p, "")),
            concerts: (concerts ?? []).map(dbConcertToSeed),
            artists: (artists ?? []).map((a: any) => ({
              id: String(a.id),
              name: a.name,
              genre: a.genre ?? "",
              coverIndex: a.cover_index ?? 1,
              members: a.members ?? 1,
            })),
            memories: hydratedMemories,
            fomoPosts: (fomoPosts ?? []).map((p: any) => ({
              id: String(p.id),
              userId: String(p.user_id ?? ""),
              username: p.username ?? "",
              body: p.body,
              concertId: p.concert_id ? String(p.concert_id) : undefined,
              artistId: p.artist_id ? String(p.artist_id) : undefined,
              reactions: p.reactions ?? { heart: 0, relatable: 0, cry: 0 },
              comments: (fomoComments ?? [])
                .filter((c: any) => String(c.post_id) === String(p.id))
                .map((c: any) => ({
                  id: String(c.id),
                  userId: String(c.user_id ?? ""),
                  username: c.username ?? "",
                  body: c.body,
                  replies: [],
                })),
              createdAt: p.created_at ?? new Date().toISOString(),
            })),
            togetherMessages: [], // loaded per-room when opened
          });

          // If signed in, load personal data
          const u = get().auth;
          if (u) {
            const [
              { data: bl }, { data: cd }, { data: sharedCd }, { data: dy }, { data: ds },
              { data: sd }, { data: sn }, { data: fc }, { data: notifs },
              { data: settings }, { data: conns }, { data: follows }, { data: reports }, { data: memoryFolders }
            ] = await Promise.all([
              supabase.from("bucket_list").select("*").eq("user_id", u.id),
              supabase.from("countdowns").select("*").eq("user_id", u.id),
              supabase.from("countdowns").select("*").contains("shared_with", [u.id]),
              supabase.from("diary").select("*").eq("user_id", u.id),
              supabase.from("dream_setlists").select("*").eq("user_id", u.id),
              supabase.from("someday_concerts").select("*").eq("user_id", u.id),
              supabase.from("song_made_night").select("*").eq("user_id", u.id),
              supabase.from("fund_contributions").select("*").eq("user_id", u.id),
              supabase.from("notifications").select("*").eq("user_id", u.id),
              supabase.from("user_settings").select("*").eq("user_id", u.id).maybeSingle(),
              supabase.from("connections").select("*").or(`requester_id.eq.${u.id},target_id.eq.${u.id}`),
              supabase.from("follows").select("follower_id,followed_id").or(`follower_id.eq.${u.id},followed_id.eq.${u.id}`),
              supabase.from("reports").select("*"),
              supabase.from("memory_folders").select("*").eq("user_id", u.id).order("created_at", { ascending: true }),
            ]);

            set({
              memoryFolders: (memoryFolders ?? []).map((folder: any) => ({ id: String(folder.id), userId: String(folder.user_id), concertId: String(folder.concert_id), name: folder.name, createdAt: folder.created_at })),
              bucketList: (bl ?? []).map((b: any) => ({
                id: String(b.id), artist: b.artist ?? "", concert: b.concert ?? "",
                tour: b.tour, date: b.date, venue: b.venue, city: b.city, notes: b.notes,
                attended: b.attended ?? false,
              })),
              countdowns: await Promise.all(Array.from(new Map([...(cd ?? []), ...(sharedCd ?? [])].map((c: any): [string, any] => [String(c.id), c])).values()).map(async (c: any) => {
                let imageUrl = c.image_url ?? "";
                if (imageUrl && !/^https?:\/\//i.test(imageUrl) && supabase) {
                  const { data } = await supabase.storage.from("memories").createSignedUrl(imageUrl, 3600);
                  imageUrl = data?.signedUrl ?? "";
                }
                return {
                  id: String(c.id), artist: c.artist ?? "", concert: c.concert ?? "",
                  date: c.date, venue: c.venue, city: c.city, notes: c.notes,
                  imageUrl, variant: c.variant ?? "minimal",
                  sharedWith: (c.shared_with ?? []).map(String),
                  ownerId: String(c.user_id ?? ""),
                  ownerUsername: (profiles ?? []).find((p: any) => String(p.id) === String(c.user_id))?.username ?? "A crowd member",
                };
              })),
              diary: (dy ?? []).map((d: any) => ({
                id: String(d.id), title: d.title ?? "", body: d.body ?? "",
                date: d.date ?? new Date().toISOString(), imageUrls: d.image_urls ?? [],
              })),
              dreamSetlists: (ds ?? []).map((s: any) => ({
                id: String(s.id), artist: s.artist ?? "", opening: s.opening ?? "",
                favorites: s.favorites ?? [], special: s.special ?? "",
                closing: s.closing ?? "", moment: s.moment ?? "",
              })),
              somedayConcerts: (sd ?? []).map((s: any) => ({
                id: String(s.id), artist: s.artist ?? "", concert: s.concert ?? "",
                fulfilled: s.fulfilled ?? false,
              })),
              songThatMadeMyNight: (sn ?? []).map((s: any) => ({
                id: String(s.id), song: s.song ?? "", why: s.why ?? "",
              })),
              oneDayFund: {
                goal: 1500,
                saved: (fc ?? []).reduce((sum: number, c: any) => sum + (c.amount ?? 0), 0),
                contributions: (fc ?? []).map((c: any) => ({
                  amount: c.amount ?? 0, label: c.label ?? "",
                  date: c.date ?? new Date().toISOString(),
                })),
              },
              notifications: (notifs ?? []).map((n: any) => ({
                id: String(n.id), type: n.type ?? "system", title: n.title ?? "",
                body: n.body ?? "", read: n.read ?? false,
                createdAt: n.created_at ?? new Date().toISOString(),
                spoilerSafe: n.spoiler_safe ?? true,
              })),
              theme: settings?.theme ?? get().theme,
              gentleUntil: settings?.gentle_until ? new Date(settings.gentle_until).getTime() : null,
              reports: (reports ?? []).map((r: any) => ({ id: String(r.id), reporterId: String(r.reporter_id ?? ""), targetType: r.target_type ?? "", targetId: String(r.target_id ?? ""), reason: r.reason ?? "", status: r.status ?? "pending" })),
              settings: settings ? {
                profileVisible: settings.profile_visible ?? true,
                showAttended: settings.show_attended ?? true,
                showBucketList: settings.show_bucket_list ?? true,
                showMemories: settings.show_memories ?? true,
                emailNotifications: settings.email_notifications ?? true,
                pushNotifications: settings.push_notifications ?? false,
                quietHoursStart: settings.quiet_hours_start ?? "22:00",
                quietHoursEnd: settings.quiet_hours_end ?? "07:00",
                customMuteList: settings.custom_mute_list ?? [],
              } : defaultSettings,
              spoilerShields: (settings?.spoiler_shields ?? []).map(String),
              gentleMutedArtists: settings?.gentle_muted_artists ?? [],
              gentleMode: settings?.gentle_mode ?? false,
              follows: (follows ?? []).map((f: any) => ({
                userId: String(f.follower_id === u.id ? f.followed_id : f.follower_id),
                direction: f.follower_id === u.id ? "following" as const : "follower" as const,
              })),
              connections: {
                fomo: (conns ?? []).filter((c: any) => c.kind === "fomo").map((c: any) => ({
                  userId: String(c.requester_id === u.id ? c.target_id : c.requester_id),
                  status: c.status ?? "pending",
                  direction: c.target_id === u.id ? "incoming" as const : "outgoing" as const,
                  label: c.label ?? "FOMO Buddy",
                })),
                buddies: (conns ?? []).filter((c: any) => c.kind === "buddy").map((c: any) => ({
                  userId: String(c.requester_id === u.id ? c.target_id : c.requester_id),
                  status: c.status ?? "pending",
                  direction: c.target_id === u.id ? "incoming" : "outgoing",
                })),
              },
            });
          }
        } finally {
          set({ loading: false });
        }
      },

      subscribeToRealtime: () => {
        if (!supabase) return;
        // Realtime: new together_messages (we'll filter by concert_id in the
        // callback so all rooms benefit from one subscription).
        const channel = supabase
          .channel("public:together_messages")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "together_messages" },
            (payload: any) => {
              const m = payload.new;
              // Skip our own messages — they're added optimistically on send.
              if (get().auth && m.user_id === get().auth!.id) return;
              const msg: TogetherMessage = {
                id: String(m.id),
                concertId: String(m.concert_id),
                userId: String(m.user_id ?? ""),
                username: m.username ?? "",
                text: m.text,
                type: m.type ?? "chat",
                createdAt: m.created_at ?? new Date().toISOString(),
              };
              set((s) => ({ togetherMessages: [...s.togetherMessages, msg] }));
            }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "concerts" },
            (payload: any) => {
              const c = payload.new;
              if (get().concerts.find((x) => x.id === String(c.id))) return;
              set((s) => ({ concerts: [dbConcertToSeed(c), ...s.concerts] }));
            }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "memories" },
            (payload: any) => {
              const m = payload.new;
              if (get().memories.find((x) => x.id === String(m.id))) return;
              if (m.visibility !== "public" || !m.approved) return;
              (async () => {
                let signedUrl = m.url ?? "";
                if (m.storage_path && supabase) {
                  const { data } = await supabase.storage.from("memories").createSignedUrl(m.storage_path, 3600);
                  signedUrl = data?.signedUrl ?? signedUrl;
                }
                set((s) => ({ memories: [dbMemoryToMemory({ ...m, url: signedUrl }), ...s.memories] }));
              })();
            }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "fomo_posts" },
            (payload: any) => {
              const p = payload.new;
              if (get().fomoPosts.find((x) => x.id === String(p.id))) return;
              set((s) => ({
                fomoPosts: [
                  {
                    id: String(p.id),
                    userId: String(p.user_id ?? ""),
                    username: p.username ?? "",
                    body: p.body,
                    concertId: p.concert_id ? String(p.concert_id) : undefined,
                    artistId: p.artist_id ? String(p.artist_id) : undefined,
                    reactions: p.reactions ?? { heart: 0, relatable: 0, cry: 0 },
                    comments: [],
                    createdAt: p.created_at ?? new Date().toISOString(),
                  },
                  ...s.fomoPosts,
                ],
              }));
            }
          )
          .subscribe();
        // Stash the channel on window so unsubscribeFromRealtime can find it.
        (globalThis as any).__itcRealtimeChannel = channel;
      },

      unsubscribeFromRealtime: () => {
        if (!supabase) return;
        const channel = (globalThis as any).__itcRealtimeChannel;
        if (channel) {
          supabase.removeChannel(channel);
          (globalThis as any).__itcRealtimeChannel = null;
        }
      },
      setView: (v) => set({ view: v }),
      navigate: (page, params) =>
        set({
          view: page,
          selectedConcertId: params?.concertId ?? get().selectedConcertId,
          selectedArtistId: params?.artistId ?? get().selectedArtistId,
          selectedUserId: params?.userId ?? get().selectedUserId,
        }),

      setStartSpaceOpen: (v) => set({ startSpaceOpen: v }),

      addConcert: (input) => {
        const u = get().auth;
        if (!u) return null;
        const artistName = input.artist.trim();
        const tourName = input.tour.trim() || "Untitled Night";
        if (!artistName) return null;
        const id = uuid();
        // Deterministic cover gradient based on artist + tour hash
        const hash = (artistName + tourName).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const coverIndex = (hash % 8) + 1;
        const dateStr = input.date ?? "";
        const isPast = dateStr ? new Date(dateStr).getTime() < Date.now() : false;
        const visibility: Visibility = input.visibility ?? "public";
        const concert: ConcertSeed = {
          id,
          artist: artistName,
          tour: tourName,
          date: dateStr,
          venue: input.venue?.trim() ?? "",
          city: input.city?.trim() ?? "",
          coverIndex,
          // User-added concerts are clearly labeled as "Added by a fan".
          unverified: true,
          libraryCount: { photos: 0, videos: 0, songWise: 0 },
          past: isPast,
          notes: input.notes?.trim() ?? "",
          createdById: u.id,
          createdByUsername: u.username,
          createdAt: new Date().toISOString(),
          visibility,
        };
        // Auto-create an artist community if this artist is new
        const existingArtist = get().artists.find((a) => a.name.toLowerCase() === artistName.toLowerCase());
        const artists = existingArtist
          ? get().artists
          : [
              ...get().artists,
              {
                id: uuid(),
                name: artistName,
                genre: "", // user can edit later
                coverIndex,
                members: 1,
              },
            ];
        const artistId = existingArtist?.id ?? artists[artists.length - 1].id;
        set((s) => ({
          concerts: [concert, ...s.concerts],
          artists,
          auth: s.auth
            ? {
                ...s.auth,
                startedConcertIds: [...s.auth.startedConcertIds, id],
                joinedConcertIds: s.auth.joinedConcertIds.includes(id)
                  ? s.auth.joinedConcertIds
                  : [...s.auth.joinedConcertIds, id],
              }
            : s.auth,
          registeredUsers: s.registeredUsers.map((ru) =>
            ru.id === u.id
              ? {
                  ...ru,
                  startedConcertIds: [...ru.startedConcertIds, id],
                  joinedConcertIds: ru.joinedConcertIds.includes(id)
                    ? ru.joinedConcertIds
                    : [...ru.joinedConcertIds, id],
                }
              : ru
          ),
          notifications: [
            {
              id: uuid(),
              type: "system",
              title: "Your space is live",
              body: `${artistName} — ${tourName} is now open. Others can find it in Explore and join the room.`,
              read: false,
              createdAt: new Date().toISOString(),
              spoilerSafe: true,
            },
            ...s.notifications,
          ],
        }));
        // Stash the artistId on the concert via a second update so the
        // Community page can link to the auto-created artist.
        // (Kept as a side-effect lookup instead of a schema field to avoid
        // breaking existing persisted data shapes.)
        void artistId;

        // LIVE MODE — push to Supabase (fire-and-forget). Use the same UUID
        // we used locally, so the local row and the DB row share an id.
        if (supabase) {
          (async () => {
            // Insert artist first (ignore if it already exists by name)
            if (!existingArtist) {
              await supabase.from("artists").upsert({
                id: artistId,
                name: artistName,
                genre: "",
                cover_index: coverIndex,
                members: 1,
              }, { onConflict: "name" });
            }
            // Insert concert
            const { error: cerr } = await supabase.from("concerts").insert({
              id,
              artist: artistName,
              tour: tourName,
              date: dateStr || null,
              venue: input.venue?.trim() ?? "",
              city: input.city?.trim() ?? "",
              notes: input.notes?.trim() ?? "",
              cover_index: coverIndex,
              unverified: true,
              past: isPast,
              library_count: { photos: 0, videos: 0, songWise: 0 },
              visibility,
              created_by: u.id,
              created_by_username: u.username,
            });
            if (cerr) {
              // Roll back the optimistic local addition on failure.
              set((s) => ({ concerts: s.concerts.filter((c) => c.id !== id) }));
              console.warn("[Supabase] addConcert failed:", cerr.message);
              return;
            }
            // Insert notification for the creator
            await supabase.from("notifications").insert({
              user_id: u.id,
              type: "system",
              title: "Your space is live",
              body: `${artistName} — ${tourName} is now open. Others can find it in Explore and join the room.`,
              spoiler_safe: true,
            });
          })();
        }

        return id;
      },

      joinConcert: (concertId) => {
        const u = get().auth;
        if (!u) return;
        if (u.joinedConcertIds.includes(concertId)) return;
        const patch = (ru: User) =>
          ru.id === u.id
            ? { ...ru, joinedConcertIds: [...ru.joinedConcertIds, concertId] }
            : ru;
        set((s) => ({
          auth: s.auth ? patch(s.auth) : s.auth,
          registeredUsers: s.registeredUsers.map(patch),
          // Bump artist community member count by 1 if the concert's artist
          // already exists in the artists list.
          artists: s.artists.map((a) =>
            s.concerts.find((c) => c.id === concertId)?.artist.toLowerCase() === a.name.toLowerCase()
              ? { ...a, members: a.members + 1 }
              : a
          ),
        }));
      },

      leaveConcert: (concertId) => {
        const u = get().auth;
        if (!u) return;
        const patch = (ru: User) =>
          ru.id === u.id
            ? { ...ru, joinedConcertIds: ru.joinedConcertIds.filter((x) => x !== concertId) }
            : ru;
        set((s) => ({
          auth: s.auth ? patch(s.auth) : s.auth,
          registeredUsers: s.registeredUsers.map(patch),
        }));
      },

      deleteConcert: (concertId) => {
        const u = get().auth;
        if (!u) return;
        const concert = get().concerts.find((c) => c.id === concertId);
        if (!concert) return;
        // Only the creator (or an admin) can delete
        if (concert.createdById !== u.id && u.role !== "admin") return;
        set((s) => ({
          concerts: s.concerts.filter((c) => c.id !== concertId),
          memories: s.memories.filter((m) => m.concertId !== concertId),
          togetherMessages: s.togetherMessages.filter((m) => m.concertId !== concertId),
          registeredUsers: s.registeredUsers.map((ru) => ({
            ...ru,
            startedConcertIds: ru.startedConcertIds.filter((x) => x !== concertId),
            joinedConcertIds: ru.joinedConcertIds.filter((x) => x !== concertId),
          })),
          auth: s.auth
            ? {
                ...s.auth,
                startedConcertIds: s.auth.startedConcertIds.filter((x) => x !== concertId),
                joinedConcertIds: s.auth.joinedConcertIds.filter((x) => x !== concertId),
              }
            : s.auth,
        }));
      },

      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
        if (typeof document !== "undefined") {
          document.documentElement.classList.remove("light", "dark");
          document.documentElement.classList.add(next);
        }
        const u = get().auth;
        if (supabase && u) void supabase.from("user_settings").update({ theme: next }).eq("user_id", u.id).then(({ error }) => { if (error) console.warn("[Supabase] theme update failed:", error.message); });
      },

      toggleGentleMode: (on) => {
        const next = on ?? !get().gentleMode;
        set({ gentleMode: next });
        if (typeof document !== "undefined") document.body.classList.toggle("gentle", next);
        const u = get().auth;
        if (supabase && u) void supabase.from("user_settings").update({ gentle_mode: next }).eq("user_id", u.id).then(({ error }) => { if (error) console.warn("[Supabase] gentle mode update failed:", error.message); });
      },
      setGentleUntil: (ts) => {
        set({ gentleUntil: ts });
        const u = get().auth;
        if (supabase && u) void supabase.from("user_settings").update({ gentle_until: ts ? new Date(ts).toISOString() : null }).eq("user_id", u.id).then(({ error }) => { if (error) console.warn("[Supabase] gentle timer update failed:", error.message); });
      },
      toggleSpoilerShield: (concertId) => {
        const next = get().spoilerShields.includes(concertId) ? get().spoilerShields.filter((x) => x !== concertId) : [...get().spoilerShields, concertId];
        set({ spoilerShields: next });
        const u = get().auth;
        if (supabase && u) void supabase.from("user_settings").update({ spoiler_shields: next }).eq("user_id", u.id).then(({ error }) => { if (error) console.warn("[Supabase] spoiler shields update failed:", error.message); });
      },
      addGentleMutedArtist: (artist) => {
        const next = get().gentleMutedArtists.includes(artist) ? get().gentleMutedArtists : [...get().gentleMutedArtists, artist];
        set({ gentleMutedArtists: next });
        const u = get().auth;
        if (supabase && u) void supabase.from("user_settings").update({ gentle_muted_artists: next }).eq("user_id", u.id).then(({ error }) => { if (error) console.warn("[Supabase] muted artists update failed:", error.message); });
      },

      addBucketItem: (item) => {
        const u = get().auth; const row = { ...item, id: uuid(), attended: false };
        set((s) => ({ bucketList: [...s.bucketList, row] }));
        if (supabase && u) void supabase.from("bucket_list").insert({ id: row.id, user_id: u.id, artist: row.artist, concert: row.concert, tour: row.tour, date: row.date || null, venue: row.venue, city: row.city, notes: row.notes, attended: false }).then(({ error }) => { if (error) console.warn("[Supabase] addBucketItem failed:", error.message); });
      },
      markBucketAttended: (id) => {
        set((s) => ({ bucketList: s.bucketList.map((b) => (b.id === id ? { ...b, attended: true } : b)) }));
        if (supabase) void supabase.from("bucket_list").update({ attended: true }).eq("id", id).then(({ error }) => { if (error) console.warn("[Supabase] markBucketAttended failed:", error.message); });
      },

      addCountdown: async (c, file) => {
        const u = get().auth;
        if (!u) throw new Error("Please sign in before adding a countdown.");
        const row = { ...c, id: uuid() };
        let storagePath = c.imageUrl ?? "";
        if (file) {
          if (!supabase) throw new Error("Photo uploads need an active cloud connection.");
          const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : (file.type.split("/")[1] || "jpg");
          storagePath = `${u.id}/countdowns/${row.id}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("memories").upload(storagePath, file, { contentType: file.type || "image/jpeg", upsert: false });
          if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
        }
        if (supabase) {
          const { error } = await supabase.from("countdowns").insert({ id: row.id, user_id: u.id, artist: row.artist, concert: row.concert, date: row.date, venue: row.venue, city: row.city, notes: row.notes, image_url: storagePath, variant: row.variant, shared_with: row.sharedWith ?? [] });
          if (error) {
            if (file && storagePath) await supabase.storage.from("memories").remove([storagePath]);
            throw new Error(`Saving countdown failed: ${error.message}`);
          }
        }
        let displayUrl = storagePath;
        if (storagePath && supabase && !/^https?:\/\//i.test(storagePath)) {
          const { data } = await supabase.storage.from("memories").createSignedUrl(storagePath, 3600);
          displayUrl = data?.signedUrl ?? "";
        }
        set((state) => ({ countdowns: [...state.countdowns, { ...row, imageUrl: displayUrl, ownerId: u.id, ownerUsername: u.username }] }));
      },
      editCountdown: (id, patch) => {
        set((s) => ({ countdowns: s.countdowns.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
        if (supabase) { const db: Record<string, unknown> = {}; if (patch.artist !== undefined) db.artist = patch.artist; if (patch.concert !== undefined) db.concert = patch.concert; if (patch.date !== undefined) db.date = patch.date; if (patch.venue !== undefined) db.venue = patch.venue; if (patch.city !== undefined) db.city = patch.city; if (patch.notes !== undefined) db.notes = patch.notes; if (patch.imageUrl !== undefined) db.image_url = patch.imageUrl; if (patch.variant !== undefined) db.variant = patch.variant; if (patch.sharedWith !== undefined) db.shared_with = patch.sharedWith; void supabase.from("countdowns").update(db).eq("id", id).then(({ error }) => { if (error) console.warn("[Supabase] editCountdown failed:", error.message); }); }
      },
      deleteCountdown: (id) => {
        set((s) => ({ countdowns: s.countdowns.filter((c) => c.id !== id) }));
        if (supabase) void supabase.from("countdowns").delete().eq("id", id).then(({ error }) => { if (error) console.warn("[Supabase] deleteCountdown failed:", error.message); });
      },

      addDiary: (d) => {
        const u = get().auth; const row = { ...d, id: uuid() };
        set((s) => ({ diary: [...s.diary, row] }));
        if (supabase && u) void supabase.from("diary").insert({ id: row.id, user_id: u.id, title: row.title, body: row.body, date: row.date, image_urls: row.imageUrls }).then(({ error }) => { if (error) console.warn("[Supabase] addDiary failed:", error.message); });
      },
      deleteDiary: (id) => {
        set((s) => ({ diary: s.diary.filter((d) => d.id !== id) }));
        if (supabase) void supabase.from("diary").delete().eq("id", id).then(({ error }) => { if (error) console.warn("[Supabase] deleteDiary failed:", error.message); });
      },

      addDreamSetlist: (sl) => {
        const u = get().auth; const row = { ...sl, id: uuid() };
        set((s) => ({ dreamSetlists: [...s.dreamSetlists, row] }));
        if (supabase && u) void supabase.from("dream_setlists").insert({ id: row.id, user_id: u.id, artist: row.artist, opening: row.opening, favorites: row.favorites, special: row.special, closing: row.closing, moment: row.moment }).then(({ error }) => { if (error) console.warn("[Supabase] addDreamSetlist failed:", error.message); });
      },
      addFundContribution: (c) => {
        const u = get().auth; const date = new Date().toISOString();
        set((s) => ({ oneDayFund: { ...s.oneDayFund, saved: s.oneDayFund.saved + c.amount, contributions: [...s.oneDayFund.contributions, { ...c, date }] } }));
        if (supabase && u) void supabase.from("fund_contributions").insert({ user_id: u.id, amount: c.amount, label: c.label, date }).then(({ error }) => { if (error) console.warn("[Supabase] addFundContribution failed:", error.message); });
      },
      addSomeday: (c) => {
        const u = get().auth; const row = { ...c, id: uuid(), fulfilled: false };
        set((s) => ({ somedayConcerts: [...s.somedayConcerts, row] }));
        if (supabase && u) void supabase.from("someday_concerts").insert({ id: row.id, user_id: u.id, artist: row.artist, concert: row.concert, fulfilled: false }).then(({ error }) => { if (error) console.warn("[Supabase] addSomeday failed:", error.message); });
      },
      markSomedayFulfilled: (id) => {
        set((s) => ({ somedayConcerts: s.somedayConcerts.map((x) => (x.id === id ? { ...x, fulfilled: true } : x)) }));
        if (supabase) void supabase.from("someday_concerts").update({ fulfilled: true }).eq("id", id).then(({ error }) => { if (error) console.warn("[Supabase] markSomedayFulfilled failed:", error.message); });
      },
      addSongMadeNight: (sn) => {
        const u = get().auth; const row = { ...sn, id: uuid() };
        set((s) => ({ songThatMadeMyNight: [...s.songThatMadeMyNight, row] }));
        if (supabase && u) void supabase.from("song_made_night").insert({ id: row.id, user_id: u.id, song: row.song, why: row.why }).then(({ error }) => { if (error) console.warn("[Supabase] addSongMadeNight failed:", error.message); });
      },

      addMemory: async (m, file) => {
        const memory: Memory = { ...m, id: uuid(), createdAt: new Date().toISOString() };
        if (supabase) {
          let storagePath = "";
          let signedUrl = "";
          if (file) {
            const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : (file.type.split("/")[1] || "bin");
            storagePath = `${memory.userId}/${memory.id}.${ext}`;
            const { error: uploadError } = await supabase.storage.from("memories").upload(storagePath, file, { contentType: file.type || undefined, upsert: false });
            if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`);
            const { data: signed } = await supabase.storage.from("memories").createSignedUrl(storagePath, 3600);
            signedUrl = signed?.signedUrl ?? "";
          }
          const { error } = await supabase.from("memories").insert({
            id: memory.id, concert_id: memory.concertId || null, user_id: memory.userId,
            username: memory.username, type: memory.type, url: "", storage_path: storagePath,
            caption: memory.caption, song_name: memory.songName ?? null, category: memory.category, folder_id: memory.folderId ?? null,
            visibility: memory.visibility, contains_spoilers: memory.containsSpoilers, approved: memory.approved,
          });
          if (error) {
            if (storagePath) await supabase.storage.from("memories").remove([storagePath]);
            throw new Error(`Saving memory failed: ${error.message}`);
          }
          memory.storagePath = storagePath || undefined;
          memory.url = signedUrl || memory.url;
        }
        set((s) => ({ memories: [memory, ...s.memories] }));
        if (memory.visibility === "public" && !memory.approved) {
          get().addNotification({ type: "memory", title: "Memory sent for review", body: `"${memory.caption}" is awaiting moderation.`, spoilerSafe: true });
        }
      },
      createMemoryFolder: async (concertId, name) => {
        const u = get().auth;
        const cleanName = name.trim();
        if (!u || !cleanName || cleanName.length > 60) return false;
        if (supabase) {
          const { data, error } = await supabase.from("memory_folders")
            .insert({ user_id: u.id, concert_id: concertId, name: cleanName })
            .select("*").single();
          if (error || !data) return false;
          set((s) => ({ memoryFolders: [...s.memoryFolders, { id: String(data.id), userId: u.id, concertId, name: data.name, createdAt: data.created_at }] }));
          return true;
        }
        const folder = { id: uuid(), userId: u.id, concertId, name: cleanName, createdAt: new Date().toISOString() };
        set((s) => ({ memoryFolders: [...s.memoryFolders, folder] }));
        return true;
      },
      renameMemoryFolder: async (folderId, name) => {
        const u = get().auth;
        const cleanName = name.trim();
        const folder = get().memoryFolders.find((f) => f.id === folderId && f.userId === u?.id);
        if (!u || !folder || !cleanName || cleanName.length > 60) return false;
        if (supabase) {
          const { error } = await supabase.from("memory_folders").update({ name: cleanName }).eq("id", folderId).eq("user_id", u.id);
          if (error) return false;
        }
        set((s) => ({ memoryFolders: s.memoryFolders.map((f) => f.id === folderId ? { ...f, name: cleanName } : f) }));
        return true;
      },
      deleteMemoryFolder: async (folderId) => {
        const u = get().auth;
        const folder = get().memoryFolders.find((f) => f.id === folderId && f.userId === u?.id);
        if (!u || !folder) return false;
        if (supabase) {
          const { error } = await supabase.from("memory_folders").delete().eq("id", folderId).eq("user_id", u.id);
          if (error) return false;
        }
        set((s) => ({
          memoryFolders: s.memoryFolders.filter((f) => f.id !== folderId),
          memories: s.memories.map((m) => m.folderId === folderId ? { ...m, folderId: undefined } : m),
        }));
        return true;
      },
      updateMemory: (id, patch) => {
        set((s) => ({ memories: s.memories.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
        if (supabase) {
          const dbPatch: Record<string, unknown> = {};
          if (patch.approved !== undefined) dbPatch.approved = patch.approved;
          if (patch.visibility !== undefined) dbPatch.visibility = patch.visibility;
          if (patch.caption !== undefined) dbPatch.caption = patch.caption;
          if (patch.folderId !== undefined) dbPatch.folder_id = patch.folderId || null;
          if (Object.keys(dbPatch).length > 0) {
            supabase.from("memories").update(dbPatch).eq("id", id)
              .then(({ error }) => { if (error) console.warn("[Supabase] updateMemory failed:", error.message); });
          }
        }
      },
      deleteMemory: async (id) => {
        const u = get().auth;
        const memory = get().memories.find((m) => m.id === id);
        if (!u || !memory || (memory.userId !== u.id && u.role !== "admin")) return false;
        if (supabase) {
          const { data, error } = await supabase.from("memories").delete().eq("id", id).select("id").maybeSingle();
          if (error || !data) {
            console.warn("[Supabase] deleteMemory failed:", error?.message ?? "No row was deleted.");
            return false;
          }
          if (memory.storagePath) {
            const { error: storageError } = await supabase.storage.from("memories").remove([memory.storagePath]);
            if (storageError) console.warn("[Supabase] memory file cleanup failed:", storageError.message);
          }
        }
        set((s) => ({ memories: s.memories.filter((m) => m.id !== id) }));
        return true;
      },

      addFomoPost: (p) => {
        const post: FomoPost = {
          ...p,
          id: uuid(),
          createdAt: new Date().toISOString(),
          reactions: { heart: 0, relatable: 0, cry: 0 },
          comments: [],
        };
        set((s) => ({ fomoPosts: [post, ...s.fomoPosts] }));
        if (supabase) {
          (async () => {
            const { error } = await supabase.from("fomo_posts").insert({
              id: post.id,
              user_id: post.userId,
              username: post.username,
              body: post.body,
              concert_id: post.concertId ?? null,
              artist_id: post.artistId ?? null,
              reactions: { heart: 0, relatable: 0, cry: 0 },
            });
            if (error) console.warn("[Supabase] addFomoPost failed:", error.message);
          })();
        }
      },
      deleteFomoPost: async (id) => {
        const u = get().auth;
        const post = get().fomoPosts.find((p) => p.id === id);
        if (!u || !post || (post.userId !== u.id && u.role !== "admin")) return false;
        if (supabase) {
          const { data, error } = await supabase.from("fomo_posts").delete().eq("id", id).select("id").maybeSingle();
          if (error || !data) {
            console.warn("[Supabase] deleteFomoPost failed:", error?.message ?? "No row was deleted.");
            return false;
          }
        }
        set((s) => ({ fomoPosts: s.fomoPosts.filter((p) => p.id !== id) }));
        return true;
      },
      addFomoComment: (postId, body) => {
        const u = get().auth;
        if (!u) return;
        const commentId = uuid();
        set((s) => ({
          fomoPosts: s.fomoPosts.map((p) =>
            p.id === postId
              ? { ...p, comments: [...p.comments, { id: commentId, userId: u.id, username: u.username, body, replies: [] }] }
              : p
          ),
        }));
        if (supabase) {
          (async () => {
            const { error } = await supabase.from("fomo_comments").insert({
              id: commentId,
              post_id: postId,
              user_id: u.id,
              username: u.username,
              body,
            });
            if (error) console.warn("[Supabase] addFomoComment failed:", error.message);
          })();
        }
      },
      reactFomo: (postId, kind) => {
        set((s) => ({
          fomoPosts: s.fomoPosts.map((p) =>
            p.id === postId ? { ...p, reactions: { ...p.reactions, [kind]: p.reactions[kind] + 1 } } : p
          ),
        }));
        if (supabase) {
          // Server-side increment would be ideal (via an RPC); for simplicity
          // we fetch the post's reactions, increment, and write back.
          (async () => {
            const { data } = await supabase.from("fomo_posts").select("reactions").eq("id", postId).maybeSingle();
            if (data && data.reactions) {
              const r = data.reactions as { heart: number; relatable: number; cry: number };
              r[kind] = (r[kind] ?? 0) + 1;
              await supabase.from("fomo_posts").update({ reactions: r }).eq("id", postId);
            }
          })();
        }
      },

      sendConnectionRequest: async (userId, kind) => {
        const u = get().auth;
        if (!u || userId === u.id) return false;
        const current = kind === "fomo" ? get().connections.fomo : get().connections.buddies;
        if (current.some((link) => link.userId === userId && link.status !== "declined")) return false;
        if (supabase) {
          const { data: existing, error: lookupError } = await supabase.from("connections")
            .select("status,requester_id,target_id")
            .eq("kind", kind)
            .or(`and(requester_id.eq.${u.id},target_id.eq.${userId}),and(requester_id.eq.${userId},target_id.eq.${u.id})`)
            .maybeSingle();
          if (lookupError) { console.warn("[Supabase] connection lookup failed:", lookupError.message); return false; }
          if (existing) {
            if (existing.status !== "declined" || existing.requester_id !== u.id) return false;
            const { error: deleteError } = await supabase.from("connections").delete().eq("requester_id", u.id).eq("target_id", userId).eq("kind", kind);
            if (deleteError) { console.warn("[Supabase] old connection request cleanup failed:", deleteError.message); return false; }
          }
          const { error } = await supabase.from("connections").insert({ requester_id: u.id, target_id: userId, kind, status: "pending" });
          if (error) { console.warn("[Supabase] sendConnectionRequest failed:", error.message); return false; }
        }
        const key: "fomo" | "buddies" = kind === "fomo" ? "fomo" : "buddies";
        set((s) => {
          const links: ConnectionLink[] = [
            ...s.connections[key].filter((link) => link.userId !== userId),
            { userId, status: "pending", direction: "outgoing" },
          ];
          return { connections: { ...s.connections, [key]: links } };
        });
        return true;
      },
      acceptConnection: async (userId, kind) => {
        const u = get().auth;
        if (!u) return false;
        if (supabase) {
          const { data, error } = await supabase.from("connections").update({ status: "accepted" })
            .eq("requester_id", userId).eq("target_id", u.id).eq("kind", kind).eq("status", "pending").select("id").maybeSingle();
          if (error || !data) { console.warn("[Supabase] acceptConnection failed:", error?.message ?? "Request not found"); return false; }
        }
        const key = kind === "fomo" ? "fomo" : "buddies";
        set((s) => ({ connections: { ...s.connections, [key]: s.connections[key].map((b) => (b.userId === userId ? { ...b, status: "accepted" } : b)) } }));
        return true;
      },
      declineConnection: async (userId, kind) => {
        const u = get().auth;
        if (!u) return false;
        if (supabase) {
          const { data, error } = await supabase.from("connections").update({ status: "declined" })
            .eq("requester_id", userId).eq("target_id", u.id).eq("kind", kind).eq("status", "pending").select("id").maybeSingle();
          if (error || !data) { console.warn("[Supabase] declineConnection failed:", error?.message ?? "Request not found"); return false; }
        }
        const key = kind === "fomo" ? "fomo" : "buddies";
        set((s) => ({ connections: { ...s.connections, [key]: s.connections[key].map((b) => (b.userId === userId ? { ...b, status: "declined" } : b)) } }));
        return true;
      },
      followUser: async (userId) => {
        const u = get().auth;
        if (!u || userId === u.id || get().follows.some((f) => f.userId === userId && f.direction === "following")) return false;
        if (supabase) {
          const { error } = await supabase.from("follows").insert({ follower_id: u.id, followed_id: userId });
          if (error) { console.warn("[Supabase] followUser failed:", error.message); return false; }
        }
        set((s) => ({ follows: [...s.follows.filter((f) => !(f.userId === userId && f.direction === "following")), { userId, direction: "following" }] }));
        return true;
      },
      unfollowUser: async (userId) => {
        const u = get().auth;
        if (!u) return false;
        if (supabase) {
          const { error } = await supabase.from("follows").delete().eq("follower_id", u.id).eq("followed_id", userId);
          if (error) { console.warn("[Supabase] unfollowUser failed:", error.message); return false; }
        }
        set((s) => ({ follows: s.follows.filter((f) => !(f.userId === userId && f.direction === "following")) }));
        return true;
      },
      shareCountdown: async (id, userIds) => {
        const u = get().auth;
        const item = get().countdowns.find((c) => c.id === id);
        if (!u || !item || item.ownerId !== u.id) return false;
        const allowed = new Set([
          ...get().connections.fomo.filter((c) => c.status === "accepted").map((c) => c.userId),
          ...get().connections.buddies.filter((c) => c.status === "accepted").map((c) => c.userId),
        ]);
        const safeIds = [...new Set(userIds)].filter((id) => allowed.has(id));
        if (supabase) {
          const { error } = await supabase.from("countdowns").update({ shared_with: safeIds }).eq("id", id).eq("user_id", u.id);
          if (error) { console.warn("[Supabase] shareCountdown failed:", error.message); return false; }
        }
        set((s) => ({ countdowns: s.countdowns.map((c) => c.id === id ? { ...c, sharedWith: safeIds } : c) }));
        return true;
      },

      sendTogetherMessage: (m) => {
        const msg: TogetherMessage = { ...m, id: uuid(), createdAt: new Date().toISOString() };
        set((s) => ({ togetherMessages: [...s.togetherMessages, msg] }));
        if (supabase) {
          // Realtime broadcast will deliver to OTHER users; we already
          // added the message optimistically to OUR local state above.
          (async () => {
            const { error } = await supabase.from("together_messages").insert({
              id: msg.id,
              concert_id: msg.concertId,
              user_id: msg.userId,
              username: msg.username,
              text: msg.text,
              type: msg.type,
            });
            if (error) {
              // Roll back on failure
              set((s) => ({ togetherMessages: s.togetherMessages.filter((x) => x.id !== msg.id) }));
              console.warn("[Supabase] sendTogetherMessage failed:", error.message);
            }
          })();
        }
      },
      addNotification: (n) => {
        const notif: AppNotification = { ...n, id: uuid(), read: false, createdAt: new Date().toISOString() };
        set((s) => ({ notifications: [notif, ...s.notifications] }));
        const u = get().auth;
        if (supabase && u) {
          (async () => {
            const { error } = await supabase.from("notifications").insert({
              id: notif.id,
              user_id: u.id,
              type: notif.type,
              title: notif.title,
              body: notif.body,
              spoiler_safe: notif.spoilerSafe,
            });
            if (error) console.warn("[Supabase] addNotification failed:", error.message);
          })();
        }
      },
      markNotificationRead: (id) => {
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
        if (supabase) {
          supabase.from("notifications").update({ read: true }).eq("id", id)
            .then(({ error }) => { if (error) console.warn("[Supabase] markNotificationRead failed:", error.message); });
        }
      },
      markAllNotificationsRead: () => {
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
        const u = get().auth;
        if (supabase && u) {
          supabase.from("notifications").update({ read: true }).eq("user_id", u.id)
            .then(({ error }) => { if (error) console.warn("[Supabase] markAllNotificationsRead failed:", error.message); });
        }
      },

      updateSettings: (patch) => {
        const u = get().auth;
        set((s) => ({ settings: { ...s.settings, ...patch } }));
        if (supabase && u) {
          const merged = { ...get().settings, ...patch };
          void supabase.from("user_settings").upsert({ user_id: u.id, profile_visible: merged.profileVisible, show_attended: merged.showAttended, show_bucket_list: merged.showBucketList, show_memories: merged.showMemories, email_notifications: merged.emailNotifications, push_notifications: merged.pushNotifications, quiet_hours_start: merged.quietHoursStart, quiet_hours_end: merged.quietHoursEnd, custom_mute_list: merged.customMuteList, theme: get().theme, gentle_mode: get().gentleMode, gentle_until: get().gentleUntil ? new Date(get().gentleUntil!).toISOString() : null, spoiler_shields: get().spoilerShields, gentle_muted_artists: get().gentleMutedArtists }, { onConflict: "user_id" }).then(({ error }) => { if (error) console.warn("[Supabase] updateSettings failed:", error.message); });
        }
      },
      updateProfile: (patch) => {
        const u = get().auth;
        set((s) => {
          if (!s.auth) return s;
          const updated = { ...s.auth, ...patch };
          return { auth: updated, registeredUsers: s.registeredUsers.map((user) => (user.id === updated.id ? updated : user)) };
        });
        if (supabase && u) {
          const db: Record<string, unknown> = {};
          if (patch.username !== undefined) db.username = patch.username;
          if (patch.bio !== undefined) db.bio = patch.bio;
          if (patch.avatarSeed !== undefined) db.avatar_seed = patch.avatarSeed;
          if (patch.favArtists !== undefined) db.fav_artists = patch.favArtists;
          if (patch.favSongs !== undefined) db.fav_songs = patch.favSongs;
          if (patch.buddyMode !== undefined) db.buddy_mode = patch.buddyMode;
          if (patch.pledgeAcceptedAt !== undefined) db.pledge_accepted_at = patch.pledgeAcceptedAt;
          if (Object.keys(db).length) void supabase.from("profiles").update(db).eq("id", u.id).then(({ error }) => { if (error) console.warn("[Supabase] updateProfile failed:", error.message); });
        }
      },
      reportContent: async (r) => {
        const u = get().auth;
        if (!u && r.targetType !== "takedown") return { ok: false, error: "Please sign in to report this content." };
        const row = { ...r, reporterId: u?.id ?? "", id: uuid(), status: "pending" as const };
        if (supabase) {
          const { error } = await supabase.from("reports").insert({
            id: row.id,
            reporter_id: u?.id ?? null,
            target_type: row.targetType,
            target_id: row.targetId,
            reason: row.reason,
            status: "pending",
          });
          if (error) {
            console.warn("[Supabase] reportContent failed:", error.message);
            return { ok: false, error: error.message };
          }
        }
        set((s) => ({ reports: [...s.reports, row] }));
        return { ok: true };
      },
      updateReportStatus: async (id, status) => {
        const u = get().auth;
        if (!u || u.role !== "admin") return false;
        if (supabase) {
          const { data, error } = await supabase.from("reports").update({ status }).eq("id", id).select("id").maybeSingle();
          if (error || !data) {
            console.warn("[Supabase] updateReportStatus failed:", error?.message ?? "No report was updated.");
            return false;
          }
        }
        set((s) => ({ reports: s.reports.map((r) => r.id === id ? { ...r, status } : r) }));
        return true;
      },
      blockUser: (userId) => {
        const next = [...new Set([...get().settings.customMuteList, userId])];
        get().updateSettings({ customMuteList: next });
      },

      resetAll: () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("in-the-crowd-store");
          window.localStorage.removeItem("concert-crowd-store"); // legacy
          window.localStorage.removeItem("itc-install-dismissed");
          window.location.reload();
        }
      },
    }),
    {
      name: "in-the-crowd-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Skip automatic rehydration so the first client render matches the
      // server render (both use default state). The Page component triggers
      // rehydration manually after mount via `useStore.persist.rehydrate()`.
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
          if (typeof document !== "undefined" && state.gentleMode) {
            document.body.classList.add("gentle");
          }
        }
      },
      partialize: (state) => ({
        auth: state.auth,
        registeredUsers: state.registeredUsers,
        view: state.view,
        theme: state.theme,
        gentleMode: state.gentleMode,
        spoilerShields: state.spoilerShields,
        gentleMutedArtists: state.gentleMutedArtists,
        quietHours: state.quietHours,
        bucketList: state.bucketList,
        countdowns: state.countdowns,
        diary: state.diary,
        dreamSetlists: state.dreamSetlists,
        oneDayFund: state.oneDayFund,
        somedayConcerts: state.somedayConcerts,
        songThatMadeMyNight: state.songThatMadeMyNight,
        concerts: state.concerts,
        artists: state.artists,
        memories: state.memories,
        fomoPosts: state.fomoPosts,
        togetherMessages: state.togetherMessages,
        notifications: state.notifications,
        connections: state.connections,
        settings: state.settings,
        reports: state.reports,
        hydrated: true,
      }),
      merge: (persisted, current) => {
        // Merge persisted data with current defaults, so new fields added in
        // code still exist for older persisted states.
        const p = (persisted ?? {}) as any;
        const ensureUser = (u: any) =>
          u && typeof u === "object"
            ? {
                ...u,
                startedConcertIds: Array.isArray(u.startedConcertIds) ? u.startedConcertIds : [],
                joinedConcertIds: Array.isArray(u.joinedConcertIds) ? u.joinedConcertIds : [],
              }
            : u;
        return {
          ...current,
          ...p,
          auth: p.auth ? ensureUser(p.auth) : current.auth,
          registeredUsers: Array.isArray(p.registeredUsers)
            ? p.registeredUsers.map(ensureUser)
            : current.registeredUsers,
        };
      },
    }
  )
);
