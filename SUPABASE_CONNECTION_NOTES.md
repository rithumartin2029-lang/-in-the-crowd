# In the Crowd — integration notes

- Existing Supabase project was retained.
- App tables now match the names and columns used by `src/lib/store.ts`.
- All 18 app tables have Row Level Security enabled.
- The existing `memories` Storage bucket remains private. Reads are allowed to the owner and to the approved audience; uploads must be under the signed-in user's ID folder.
- The `supabase_realtime` publication includes `together_messages`, `concerts`, `memories`, `fomo_posts`, and `notifications`.
- Admin checks live in the non-exposed `private` schema. Trigger-only functions are not exposed as RPCs.
- Profile roles and memory approval are protected against self-promotion; connection participant IDs cannot be edited after a request is created.
- Netlify environment variables use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

The app source now persists personal list entries, settings, reports, connection requests, and media uploads to Supabase. Media uploads are stored in the private `memories` bucket and use short-lived signed URLs when loaded.
