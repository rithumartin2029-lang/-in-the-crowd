# Going live with Supabase — beginner-friendly setup

This guide walks you through connecting **In the Crowd** to a free Supabase project so it becomes a real multi-user community website. The site already works in "Local mode" (data per-browser); adding Supabase upgrades it to "Live mode" where everyone sees the same concerts, posts, and chat messages, and users can sign in from any device.

**Cost**: Free (Supabase free tier covers 500 MB database + 1 GB file storage + 50,000 monthly active users — plenty for a small community).

**Time**: ~15 minutes.

---

## Step 1 — Create a free Supabase project

1. On your phone or computer, go to **https://supabase.com** → **Start your project**.
2. Sign in with GitHub (or email).
3. Tap **New project**.
4. Fill in:
   - **Name**: `in-the-crowd` (anything works)
   - **Database password**: tap "Generate a password" and **save it somewhere safe** (you won't need it for this guide, but Supabase requires it)
   - **Region**: pick the one closest to most of your users (e.g. `Southeast Asia (Singapore)` or `East US`)
   - **Pricing plan**: Free
5. Tap **Create new project**. Wait ~2 minutes for it to provision.

## Step 2 — Run the database schema

The schema (tables + Row Level Security policies) is already written for you in [`supabase/schema.sql`](../supabase/schema.sql) in this project. You just need to paste it into Supabase.

1. In your Supabase dashboard, open the **SQL Editor** (left sidebar → square icon with `</>` → **New query**).
2. Open the file `supabase/schema.sql` from the project. On Android, you can use any text editor (Files, ZArchiver, or VS Code mobile) to open it. **Select all** and **copy**.
3. Paste into the Supabase SQL editor.
4. Tap **Run** (bottom-right). You should see "Success. No rows returned."
5. That's it — every table, trigger, and security policy is now in place.

## Step 3 — Get your Project URL and anon key

1. In the Supabase dashboard, go to **Settings** (bottom-left gear icon) → **API**.
2. Find and copy these two values:
   - **Project URL**: looks like `https://abcdefgh.supabase.co`
   - **anon public key**: a long string starting with `eyJ...`

These two values are **safe to expose in frontend code** — Row Level Security (defined in the schema) protects your data. Never expose the `service_role` key though (that one is privileged).

## Step 4 — Disable email confirmation (recommended for testing)

By default, Supabase requires users to click a confirmation link in their email before they can sign in. For a small community you probably want to turn this off so signup is instant.

1. In Supabase dashboard → **Authentication** (left sidebar) → **Providers** → **Email**.
2. Toggle **Confirm email** OFF.
3. Tap **Save**.

(You can turn it back on later when you launch publicly — it helps prevent spam signups.)

## Step 5 — Add the env vars to your hosting provider

### If deploying on Vercel (recommended):
1. Open your Vercel project → **Settings** → **Environment Variables**.
2. Add two variables:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL` → **Value**: your Project URL from Step 3
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` → **Value**: your anon public key from Step 3
3. Set the Environment to **Production** (and also **Preview** and **Development** if you want).
4. Tap **Save**.
5. Go to **Deployments** → tap the most recent one → **...** → **Redeploy**.


### If your site is hosted on Netlify
1. Open your existing Netlify site (`in-the-crowd-18`) → **Project configuration** → **Environment variables**.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` using the values from your existing Supabase project. These are the browser-safe project URL and publishable key; never use a service-role or secret key here.
3. Make sure the variables apply to **Production** (and Preview if needed), then trigger a new deploy so Next.js can read them during its build.
4. The project includes `netlify.toml` with the Next.js build configuration.

The existing Netlify project can be kept; do not create a replacement website.

### If running locally:
1. In the project root, create a file named `.env.local`.
2. Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
3. Restart the dev server.

## Step 6 — Verify it's working

1. Visit your deployed site.
2. Look at the **footer** — the badge should now say **"Live mode"** (was "Local mode").
3. Sign up for an account. **The first account you create becomes the admin.**
4. Start a space, post in a FOMO thread, send a Together message.
5. Open the site in a different browser (or incognito) and sign up as another user. You should see the same concerts and posts. If you both open the same Together room, messages appear live.

That's it — you now have a real, public, multi-user concert community website.

---

## What syncs via Supabase

| Feature | Synced across users/devices? |
|---|---|
| Sign up / sign in | ✅ Yes — real auth via Supabase Auth |
| Concerts / spaces | ✅ Yes — anyone can see public concerts |
| Memory library uploads | ✅ Yes — files go to Supabase Storage, metadata to the `memories` table |
| FOMO Wall posts + comments | ✅ Yes |
| Together chat rooms | ✅ Yes — **live** via Supabase Realtime |
| Notifications | ✅ Yes — stored per-user in Supabase |
| Bucket list, countdowns, diary, dream setlists, One Day Fund, Someday, Song Made My Night | ✅ Yes — stored per-user (visible only to you) |
| Spoiler Shield settings | ✅ Yes — stored in `user_settings` |
| Gentle Mode | ✅ Yes — stored in `user_settings` |
| Reports (admin moderation) | ✅ Yes — admins see all reports |

## Privacy & security

The schema includes Row Level Security policies that enforce:
- **Public concerts** visible to everyone; **private/connections-only** concerts visible only to the creator
- **Approved public memories** visible to everyone; **private memories** visible only to the creator
- **Personal data** (bucket list, diary, countdowns, etc.) visible only to the owner
- **Notifications** visible only to the recipient
- **Reports** visible only to the reporter and admins
- **Storage uploads** can only be written to a path under your own user ID

The anon key is safe to ship in frontend code because RLS is enforced at the database level — not the client.

## Troubleshooting

**"Local mode" badge still showing after adding env vars?**
- Vercel: make sure you redeployed after adding the env vars
- Local: restart your dev server (`bun run dev` or `npm run dev`)

**Sign-up fails with "User already registered"?**
- That email is already in Supabase Auth. Use a different email, or sign in instead.

**Can't see concerts another user created?**
- Make sure both of you are signed in (anonymous users can see public concerts, but only signed-in users can create them)
- Check that the concert's visibility is "public"
- Verify RLS is enabled: in Supabase dashboard → Table Editor → `concerts` → there should be a shield icon next to the table name

**Together messages don't appear live?**
- Make sure you ran the full `schema.sql` including the `alter publication supabase_realtime add table ...` lines
- In Supabase dashboard → Database → Replication → `supabase_realtime` publication → make sure `together_messages`, `concerts`, `memories`, `fomo_posts`, `notifications` are all listed

**Need to wipe all data and start over?**
- Supabase dashboard → Table Editor → each table → "Delete all rows"
- OR re-run the schema.sql after dropping everything: `drop schema public cascade; create schema public;` then paste schema.sql again

## Need more help?
- Supabase docs: https://supabase.com/docs
- Next.js + Supabase guide: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
