# Pickle Palms 2026

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

- **email**: `admin@picklepalms.local` (or whatever you put in `ADMIN_EMAIL`)
- **password**: `changeme123`

**Change this password immediately** by signing in, deleting the seeded user
and signing up again, or by updating it directly in the database.

## Deploy to Vercel

Recommended path: deploy on Vercel and use **Neon Postgres** through Vercel's
Storage tab. Everything lives under one Vercel project — one dashboard, one
login, env vars wired up automatically — and both tiers are free.

1. Push this repo to GitHub.
2. In Vercel, "New Project" → import the repo. Don't deploy yet (or let the
   first build fail; you'll redeploy after step 3).
3. In the project's **Storage** tab → **Create Database** → **Neon**
   (Serverless Postgres). Vercel will create the database and automatically
   inject `DATABASE_URL` (and a few related vars) into the project's
   environment variables.
4. Add the remaining environment variables:
   - `NEXTAUTH_SECRET` — generate one with `openssl rand -base64 32`.
   - `NEXTAUTH_URL` — your deployed URL, e.g. `https://your-app.vercel.app`.
   - `ADMIN_EMAIL` *(optional)* — the email that should be granted admin on
     signup.
5. Redeploy. The build runs `prisma generate` automatically. You still need
   to push the schema once — grab the `DATABASE_URL` from Vercel's Storage
   tab and run locally:
   ```bash
   DATABASE_URL="..." npx prisma db push
   DATABASE_URL="..." npm run db:seed   # optional; creates sample data
   ```

### Other free Postgres options

If you'd rather not use Neon, any Postgres provider works — just set
`DATABASE_URL` yourself:

- [Supabase](https://supabase.com) — free tier; use the **Connection Pooling**
  string (port 6543). Note: free projects pause after ~1 week of inactivity.
- [Neon](https://neon.tech) direct (without the Vercel integration) — free
  tier, no credit card.

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
