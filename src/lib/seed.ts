import type {
  ConcertSeed,
  ArtistSeed,
  Memory,
  FomoPost,
  TogetherMessage,
  AppNotification,
} from "./store";

// The site starts empty. Concerts, artists, memories, FOMO posts, Together
// messages and notifications are all created by signed-in users.
// "Start a space" is the primary entry point — a user adds a concert (artist,
// venue, city, etc.) and a joinable space is created around it.

export const seedConcerts: ConcertSeed[] = [];
export const seedArtists: ArtistSeed[] = [];
export const seedMemories: Memory[] = [];
export const seedFomoPosts: FomoPost[] = [];
export const seedTogetherMessages: TogetherMessage[] = [];
export const seedNotifications: AppNotification[] = [];
