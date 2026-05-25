# Building Pickle Palms 2026

I wanted a real-time scoreboard for a weekend tournament with my friends. What started as a generic-looking Next.js app called "Burton Valley Dads' Pickleball Challenge" turned into a polished little tournament site called **Pickle Palms 2026** — with prediction markets, player profiles, charts, and a visual style cribbed from [di.gg](https://di.gg).

This is a build-in-public write-up of how I shipped it, what I borrowed, what I broke, and what I learned.

## The stack

- **Next.js 14** (App Router) on **Vercel**
- **Postgres on Neon**, wired through Vercel's Storage tab so the whole stack lives in one dashboard
- **Prisma** for schema and queries
- **NextAuth** (credentials) for login
- **Tailwind** + **JetBrains Mono** for the di.gg-ish typography
- **Recharts** for the bar / donut charts on player and event pages

The deploy story is the headline: **one Vercel project, free Neon database attached via the Vercel Marketplace, free tier the whole way.** Vercel Storage auto-injects `DATABASE_URL` into env; the only manual step was running `npx prisma db push` once from my laptop against the production database to create the tables.

## The first decision: stop hosting Postgres on my laptop

The repo originally pointed at a local Postgres. Fine in dev, but the whole point was to share a URL with friends. The options I weighed:

- **Supabase** — great free tier, generous, but projects pause after ~a week of inactivity. Fine for most side projects, but I wanted no cold starts.
- **Neon via Vercel** — same Postgres, same free tier as direct Neon, but configured through Vercel's Storage tab so it shows up as part of the same project. One dashboard, one login, one bill (if I ever leave the free tier).
- **Vercel Postgres direct** — same Neon under the hood, just older branding.

I went with **Neon via Vercel.** No regrets. `DATABASE_URL` got injected automatically, latency from Vercel functions to the DB is fine, and it doesn't pause.

## Inspirations

Two sites shaped the look and feel:

### di.gg

The redesigned Digg uses a paper-cream background, JetBrains Mono uppercase labels with wide letter-spacing, thin borders instead of shadows, and big bold numbers. I love the data-density without feeling cluttered — the way they pair a tiny `// SECTION` kicker with a big sans-serif headline.

I lifted that pattern directly:

```
// Live
Scoreboard
```

The cream background is `#f4efe5`. Ink is `#0f0f0f`. Borders are `rgba(15,15,15,0.10)`. JetBrains Mono renders every uppercase metadata label — `EVENTS WON`, `PTS / MATCHUP`, `N/M SETTLED`, `YOUR PICK`. Inter handles the body. That pattern became a unified design language I leaned on for every new feature.

### Polymarket

For the prediction widget I wanted that "share of voice" feel — a team chip with a colored dot, the percentage rendered large on the right, and a thin colored bar at the bottom showing the share. Polymarket nails that pattern. The result:

```
🔵 Dinkers              63%  12
[██████████░░░░░░░░]

🔴 Smashers             37%  7
[██████░░░░░░░░░░░░]
```

When you've picked one, your chip gets an inverted "Your pick" pill. When the event finishes, the winner gets a "Won" badge. It feels like a market, not a poll.

## The build, in highlights

### Rebrand

"Burton Valley Dads' Pickleball Challenge" → "Pickle Palms 2026." Cucumber → palm tree. Header, footer, browser title, admin email default, README, npm package name. Took ten minutes. Felt like the whole site grew up.

### Per-matchup predictions

The seeded app only had two prediction levels: **overall champion** (who wins the weekend) and **event winner** (who wins, say, the pickleball round-robin). But each event has many matchups — singles, doubles, head-to-head — and I wanted picks on every one.

New `MatchupPrediction` model, one row per `(user, matchup)`, locked once the matchup is settled. The same `PredictionWidget` now drives all three pick types — overall, event, matchup — because I refactored it to take an explicit `endpoint` prop instead of inferring it from an `eventId`. Three call sites, one component.

The fun part was the **hindsight section.** After an event completes, the bottom of the event page shows a "Predictions vs Reality" table: every player's event pick + every matchup pick, marked ✓ or ✗, with their score for the event in the rightmost column. Real-time gloating fuel.

### Per-matchup scoring

This was the biggest *product* call of the build. Originally, finishing an event awarded the event's `pointsValue` to the winner once. So a 10-point event was 10 points, period — regardless of how many matchups were inside it.

That felt wrong for a real tournament. If you've got 10 doubles matchups and a team wins 6, they should get *more* points than a team that wins just 4. So I shifted the model: **each matchup awards `pointsValue` to the winning team.** A 5-pt event with 10 matchups distributes 50 points total, split however the matchup wins fall.

Labels everywhere needed to change: `X PTS` → `X PTS / MATCHUP`. Event cards grew a strip at the bottom — `🔵 15  🔴 10  3/10 SETTLED` — so you can see the live score breakdown without opening the event.

### Player profiles

Each player roster row links to `/players/[id]`. The page shows:

- **Stat grid**: matchups, win rate, points won, pick accuracy
- **Three recharts charts**: win/loss donut (centered on win-rate %), points-per-event bar, pick-accuracy donut
- **Match history** grouped by event, with each matchup showing the opponent pair (linked to *their* profiles), the score, and a ±N badge
- **Recent picks + comment activity** when the player is linked to a user account

Adding recharts cost ~90 kB of JS on the player page. Worth it for the storytelling.

### Teams + events polish

The teams page got fan-pulse donuts (who's rooting for who, who picked which champion) and ranked rosters with team-colored mini bars showing each player's points contribution.

The events page got a status summary header (`12 TOTAL · 4 DONE · 1 LIVE · 7 UPCOMING`) and a "Matchups won per event" grouped bar chart at the top — telling the rivalry story across the tournament at a glance.

## Mistakes

**The Prisma gotcha.** Twice — I shipped a schema change to main without remembering that Vercel doesn't run migrations automatically. The first symptom was a `PrismaClientKnownRequestError: The table public.MatchupPrediction does not exist`. Fix: `DATABASE_URL="..." npx prisma db push` from my laptop. Better fix I haven't implemented yet: a Vercel build step that runs the push.

**The `git pull` that wasn't.** When I tried to fix the missing-table issue, my `git pull` aborted because of a local `package-lock.json` change I hadn't committed. `prisma db push` then ran against the *old* schema and reported "already in sync." I almost convinced myself the deploy was broken. Lesson: when something "succeeded" but the symptom didn't change, check whether the right code is actually on disk. (Aborting `git pull` is loud; I had skimmed it.)

**Visual over-design.** I added a big `bg-emerald-50` box on the winning side of completed matchups, plus a `✓ WIN` microlabel. It read way too loud — like a TV graphic dropped into a quiet UI. Dimming the loser to 60% opacity says the same thing without shouting. Took the green out.

**Branch hygiene.** When a PR gets merged, the source branch sticks around. I kept accidentally trying to push more commits to a merged branch and having to cut fresh ones off main. Easy mistake, easy fix, kept happening anyway.

## Moments I'm proud of

**The unified `PredictionWidget`.** Three different prediction types — overall champion, event winner, matchup winner — all rendered by the same component. The trick was refactoring it from `eventId?: string` (which implied the endpoint) to `endpoint: string` (explicit). Now every prediction surface across the app feels consistent because it *is* the same surface, parameterized.

**The combined accuracy leaderboard.** I almost split it into "event accuracy" and "matchup accuracy" ranks. One combined number is simpler, ranks engaged predictors higher, and saves a whole UI section. Better product, less code.

**The `// section` kicker.** Tiny, but it became the through-line. Every section on every page got a mono `// Verb` eyebrow above the title. By the third page I built, it felt like a real site.

**The points-from-this-event panel.** Showing each team's running points + matchup wins for the *current* event — not just total tournament points — made scoring transparent for anyone reading the event page. "We've awarded 30 of a possible 50 points so far" tells you exactly where you are.

## What I'd do differently

- **Automate `prisma db push`** on deploy. A Vercel build step would have caught both of my schema-deploy gotchas before users saw an error.
- **Use squash merges from the start.** Six PRs in, my main branch history is a forest of "merge", "squash", "rebase" mixed together.
- **Don't build the polish until the gameplay loop is tested.** I spent time on the di.gg kicker treatment before any matchup had ever been scored. The product call (per-matchup vs per-event scoring) was way more important than the typography and should have happened earlier.

## A note on how this got built

A lot of this was built in conversation with an AI coding agent — Claude, in particular. I describe the next feature I want, it explores the codebase, asks one or two product clarifications, drafts the change, builds locally, opens the PR. The role I played: product owner, taste-arbiter, code reviewer, person-who-actually-knows-the-friends-the-tournament-is-for.

What I learned about the workflow:

- **Decisions still belong to you.** The model is great at writing the per-matchup scoring code; it's not great at deciding *whether* points should be per-event or per-matchup. That's a product call you have to make.
- **Small clarifications go a long way.** Most of the strongest decisions in this build came from a quick "one combined leaderboard or two?" question rather than from any specific prompt.
- **Code review by reading the PR is real work.** Squash + summary still leaves you accountable for what's in there.

## Stack notes for anyone copying this

- Total cost: **$0/month** (Vercel Hobby + Neon free)
- Cold start: imperceptible after the first hit; Neon doesn't pause unless you stop using it for ~7 days
- DB migrations: still manual via `npx prisma db push`
- The repo is ~3,000 LoC of TypeScript; about 80% of it is the data fetching + UI for events, players, matchups, and predictions

## What's next

- Comment-activity-over-time chart on player pages (need a date-bucketed query)
- Player avatars beyond emoji (Vercel Blob or Supabase Storage)
- DMs / @-mentions in the lounge
- A live activity feed: "X just picked Smashers for the cornhole final"

If you're running your own weekend tournament — bachelor party, family reunion, summer camp — the bones of this thing are pretty portable. The schema is mostly: teams, players, events, matchups, predictions, comments. Everything else is decoration.

Now go run the round-robin.
