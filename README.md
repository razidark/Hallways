# 🌌 Hallway

**The immersive social corridor for high-fidelity communication.**

Hallway is a social platform built around *Reality Sync* — minimising the friction
between what you do and what the rest of the world sees. It pairs a signature
hexagonal identity system with glassmorphic surfaces, turning the familiar social
feed into a technical "corridor".

---

## Features

- **Posts** with images, captions, music, comments, likes, saves and reposts
- **Profiles** with avatars, banners, bios, follower counts and verified badges
- **Stories** that expire
- **Direct messages** and group chats
- **Realtime** updates via Supabase Realtime
- **Notifications** for follows, likes, comments and messages
- **Global search** across users, posts and messages
- **Reels** — a vertical short-form feed
- **Admin panel** — role management and content moderation

## Tech stack

| | |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS with HSL variable tokens, glassmorphism |
| Geometry | Custom hexagonal design system |
| Backend | Supabase — PostgreSQL, Realtime, Storage, Auth |
| Icons | lucide-react |

## Requirements

- Node.js 20+
- npm
- A Supabase project (free tier is enough)

## Getting started

```bash
npm install
```

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then:

```bash
npm run dev      # -> http://127.0.0.1:5175
```

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | production build to `dist/` |
| `npm run lint` | ESLint |
| `npm run preview` | serve the production build |

## Database

The schema lives in [`schema.sql`](schema.sql). The migrations under
[`supabase/`](supabase/) are applied in order; `supabase_hardening_v3.sql` and
`supabase/migrations/` carry the RLS policies, the admin guard and the
counter-maintenance triggers.

```bash
supabase db push          # if you use the Supabase CLI
```

or paste `schema.sql` into the Supabase SQL editor.

### What the schema gives you

- **Row Level Security on every table** — profiles, posts, comments, likes,
  saves, follows, messages, notifications
- **Role-based admin** — `profiles.role` is the single source of truth, and a
  trigger prevents anyone but an admin from changing it or granting the
  verified badge
- **Maintained counters** — `posts_count` and `followers_count` are kept
  accurate by triggers rather than by the client
- **Storage policies** that scope uploads to the owner's folder

## Documentation

| Document | What it covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | the full system design — data model, RLS strategy, state management |
| [DEVELOPER_MANUAL.md](DEVELOPER_MANUAL.md) | day-to-day development guide |
| [LAUNCH_HANDBOOK.md](LAUNCH_HANDBOOK.md) | deployment checklist |

## Security notes

- Admin status comes **only** from `profiles.role`. There is no username-based
  bypass anywhere in the client or the database.
- The verified badge can be granted or revoked by an admin only — enforced by a
  `BEFORE UPDATE` trigger, because a `WITH CHECK` subquery on the same table
  compares the new row against itself and would always pass.
- Updating a post is ownership-checked in the client and owner-scoped by RLS;
  the delete path verifies a row was actually removed before reporting success.
- `.env` is git-ignored. Never commit the anon key or a service-role key.

## Credits

Created by **RZL Apps**.
