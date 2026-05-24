# Burton Valley Dads' Pickleball Challenge

A weekend-competition web app. Two teams, many events (pickleball being the
main one), manual scoring, per-event prediction polls, comments, and login.

## Features

- **Auth**: email + password. First account created is admin (configurable via
  `ADMIN_EMAIL` env var).
- **Teams & players**: admin manages two (or more) teams and their player
  rosters. Players can be linked to a user account.
- **Events**: any number — pickleball, cornhole, chili cook-off, trivia,
  whatever. Each event has a name, description, location, start time, and
  point value.
- **Matchups**: within an event, define head-to-head matchups (singles or
  doubles) with per-matchup scores and winner.
- **Scoring**: admin marks an event's overall winner; points are added to the
  scoreboard automatically.
- **Predictions**: every signed-in user can pick a team to win each event and
  pick the overall champion. The widget shows live percentages and counts.
- **Leaderboard**: ranks users by prediction accuracy across completed events.
- **Comments**: per-event trash talk + a global "Lounge" thread.

## Stack

- Next.js 14 (App Router) + React 18
- TypeScript, Tailwind CSS
- Prisma + Postgres
- NextAuth.js (Credentials provider)

## Local development

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
# edit .env: set DATABASE_URL and NEXTAUTH_SECRET

# 3. Initialize the database
npm run db:push       # creates tables
npm run db:seed       # seeds two teams + sample events + admin user

# 4. Run
npm run dev
# open http://localhost:3000
```

After seeding, the default admin is:

- **email**: `admin@burtonvalley.local` (or whatever you put in `ADMIN_EMAIL`)
- **password**: `changeme123`

**Change this password immediately** by signing in, deleting the seeded user
and signing up again, or by updating it directly in the database.

## Deploy to Vercel

1. Create a free Postgres database. Easiest options:
   - [Neon](https://neon.tech) — free tier, no credit card.
   - [Vercel Postgres](https://vercel.com/storage/postgres).
   - [Supabase](https://supabase.com) — use the connection string in
     "Connection Pooling" mode.
2. Push this repo to GitHub.
3. In Vercel, "New Project" → import the repo.
4. Add environment variables:
   - `DATABASE_URL` — the Postgres connection string. For Neon/Supabase make
     sure to use the **pooled** URL and include `?sslmode=require`.
   - `NEXTAUTH_SECRET` — generate one with `openssl rand -base64 32`.
   - `NEXTAUTH_URL` — your deployed URL, e.g. `https://your-app.vercel.app`.
   - `ADMIN_EMAIL` *(optional)* — the email that should be granted admin on
     signup.
5. Deploy. The first build runs `prisma generate` automatically. You still
   need to push the schema once:
   ```bash
   DATABASE_URL="..." npx prisma db push
   DATABASE_URL="..." npm run db:seed   # optional; creates sample data
   ```
   (Run those locally pointed at the production database, or use a one-off
   Vercel CLI command.)

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Scoreboard, upcoming events, recent comments |
| `/events` | List of all events |
| `/events/[id]` | Event detail: matchups, prediction widget, comments |
| `/teams` | Team rosters |
| `/leaderboard` | Overall championship pick + predictions leaderboard |
| `/lounge` | Global comment thread |
| `/admin` | Teams, players, users, event index (admin only) |
| `/admin/events/new` | Create a new event |
| `/admin/events/[id]` | Edit event details, set winner/score, manage matchups |

## Notes

- Predictions lock once an event is marked **Completed**.
- A user's overall championship pick is stored on their account; changing it
  any time before the weekend is over is fine — there's no auto-lock for the
  overall pick.
- Admin grants are checked on every request, so revoking admin takes effect
  on the user's next page load.
