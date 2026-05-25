import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getPredictionLeaderboard } from "@/lib/scoring";
import { PredictionWidget } from "@/components/PredictionWidget";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [leaderboard, teams, championPicks, me] = await Promise.all([
    getPredictionLeaderboard(),
    prisma.team.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({
      where: { championPickTeamId: { not: null } },
      select: { championPickTeamId: true },
    }),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          include: {
            championPickTeam: true,
            predictions: {
              include: {
                event: { include: { winnerTeam: true } },
                pickedTeam: true,
              },
            },
            matchupPredictions: {
              include: {
                matchup: {
                  include: {
                    event: true,
                    winnerTeam: true,
                    teamA: true,
                    teamB: true,
                  },
                },
                pickedTeam: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const championTotals: Record<string, number> = {};
  for (const t of teams) championTotals[t.id] = 0;
  for (const u of championPicks) {
    if (u.championPickTeamId)
      championTotals[u.championPickTeamId] = (championTotals[u.championPickTeamId] || 0) + 1;
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-2">
          <div className="section-kicker">// Champion</div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Overall Championship</h1>
        </div>
        <PredictionWidget
          endpoint="/api/predict/overall"
          kicker="Champion Pick"
          title="Who wins the whole thing?"
          teams={teams.map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            emoji: t.emoji,
          }))}
          totals={championTotals}
          totalCount={championPicks.length}
          myPick={me?.championPickTeamId ?? null}
          locked={false}
          loggedIn={Boolean(userId)}
        />
      </section>

      <section>
        <div className="mb-2">
          <div className="section-kicker">// You</div>
          <h2 className="text-2xl font-bold text-ink tracking-tight">Your Picks</h2>
        </div>
        <YourPicks me={me} />
      </section>

      <section>
        <div className="mb-2">
          <div className="section-kicker">// Rankings</div>
          <h2 className="text-2xl font-bold text-ink tracking-tight">Picks Leaderboard</h2>
        </div>
        <div className="card overflow-hidden bg-paper">
          {leaderboard.length === 0 ? (
            <div className="p-6 text-center text-sm text-ink-soft">
              No completed events yet — leaderboard will fill in once events finish.
            </div>
          ) : (
            <div className="divide-y divide-ink/10">
              {leaderboard.map((row, i) => {
                const acc = Math.round(row.accuracy * 100);
                return (
                  <div
                    key={row.userId}
                    className="flex items-center gap-4 p-4"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-md bg-paper-dark border border-ink/10 font-mono font-bold text-ink">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink truncate">{row.name}</div>
                      <div className="kicker mt-0.5">
                        {row.correct}/{row.total} correct
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="stat-num text-2xl text-ink">{acc}%</div>
                      <div className="kicker">accuracy</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

type TeamLite = { id: string; name: string; color: string; emoji: string | null };

type MeWithPicks = {
  championPickTeam: TeamLite | null;
  predictions: {
    id: string;
    pickedTeamId: string | null;
    pickedTeam: TeamLite | null;
    event: {
      id: string;
      name: string;
      sortOrder: number;
      status: string;
      winnerTeamId: string | null;
      winnerTeam: TeamLite | null;
    };
  }[];
  matchupPredictions: {
    id: string;
    pickedTeamId: string;
    pickedTeam: TeamLite;
    matchup: {
      id: string;
      label: string;
      winnerTeamId: string | null;
      winnerTeam: TeamLite | null;
      teamA: TeamLite;
      teamB: TeamLite;
      event: { id: string; name: string; sortOrder: number; status: string };
    };
  }[];
} | null;

function YourPicks({ me }: { me: MeWithPicks }) {
  if (!me) {
    return (
      <div className="card p-4 bg-paper text-sm text-ink-soft">
        <Link href="/login" className="text-ink underline underline-offset-2">
          Sign in
        </Link>{" "}
        to see your picks.
      </div>
    );
  }

  type Block = {
    eventId: string;
    eventName: string;
    sortOrder: number;
    status: string;
    eventPick: {
      pickedTeam: TeamLite | null;
      winnerTeam: TeamLite | null;
      settled: boolean;
    } | null;
    matchupPicks: {
      matchupId: string;
      label: string;
      pickedTeam: TeamLite;
      winnerTeam: TeamLite | null;
      settled: boolean;
    }[];
  };

  const blocks = new Map<string, Block>();
  const ensure = (
    eventId: string,
    name: string,
    sortOrder: number,
    status: string
  ): Block => {
    let b = blocks.get(eventId);
    if (!b) {
      b = {
        eventId,
        eventName: name,
        sortOrder,
        status,
        eventPick: null,
        matchupPicks: [],
      };
      blocks.set(eventId, b);
    }
    return b;
  };

  for (const p of me.predictions) {
    if (!p.pickedTeamId) continue;
    const b = ensure(p.event.id, p.event.name, p.event.sortOrder, p.event.status);
    b.eventPick = {
      pickedTeam: p.pickedTeam,
      winnerTeam: p.event.winnerTeam,
      settled: p.event.status === "COMPLETED" && p.event.winnerTeamId != null,
    };
  }

  for (const mp of me.matchupPredictions) {
    const b = ensure(
      mp.matchup.event.id,
      mp.matchup.event.name,
      mp.matchup.event.sortOrder,
      mp.matchup.event.status
    );
    b.matchupPicks.push({
      matchupId: mp.matchup.id,
      label:
        mp.matchup.label ||
        `${mp.matchup.teamA.name} vs ${mp.matchup.teamB.name}`,
      pickedTeam: mp.pickedTeam,
      winnerTeam: mp.matchup.winnerTeam,
      settled: mp.matchup.winnerTeamId != null,
    });
  }

  // Tally
  let correct = 0;
  let total = 0;
  for (const b of blocks.values()) {
    if (b.eventPick?.settled && b.eventPick.pickedTeam) {
      total += 1;
      if (b.eventPick.pickedTeam.id === b.eventPick.winnerTeam?.id) correct += 1;
    }
    for (const m of b.matchupPicks) {
      if (m.settled) {
        total += 1;
        if (m.pickedTeam.id === m.winnerTeam?.id) correct += 1;
      }
    }
  }
  const acc = total === 0 ? null : Math.round((correct / total) * 100);

  const ordered = Array.from(blocks.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <div className="card p-4 bg-paper space-y-5">
      <div className="flex items-baseline justify-between">
        <div className="kicker">Settled so far</div>
        <div className="flex items-baseline gap-2">
          <span className="stat-num text-2xl text-ink">
            {acc == null ? "—" : `${acc}%`}
          </span>
          <span className="kicker">
            {correct}/{total} CORRECT
          </span>
        </div>
      </div>

      <div>
        <div className="kicker mb-1.5">Champion Pick</div>
        {me.championPickTeam ? (
          <PickRow
            label="Overall champion"
            pickedTeam={me.championPickTeam}
            winnerTeam={null}
            settled={false}
          />
        ) : (
          <div className="text-sm text-ink-soft">
            No champion pick yet. Tap a team above.
          </div>
        )}
      </div>

      {ordered.length === 0 ? (
        <div className="text-sm text-ink-soft">
          No event or matchup picks yet. Browse{" "}
          <Link href="/events" className="text-ink underline underline-offset-2">
            events
          </Link>
          .
        </div>
      ) : (
        ordered.map((b) => (
          <div key={b.eventId} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Link
                href={`/events/${b.eventId}`}
                className="font-semibold text-ink hover:underline underline-offset-2"
              >
                {b.eventName}
              </Link>
              <span className="kicker">{b.status.replace("_", " ").toLowerCase()}</span>
            </div>
            {b.eventPick && b.eventPick.pickedTeam && (
              <PickRow
                label="Event winner"
                pickedTeam={b.eventPick.pickedTeam}
                winnerTeam={b.eventPick.winnerTeam}
                settled={b.eventPick.settled}
              />
            )}
            {b.matchupPicks.map((m) => (
              <PickRow
                key={m.matchupId}
                label={m.label}
                pickedTeam={m.pickedTeam}
                winnerTeam={m.winnerTeam}
                settled={m.settled}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function PickRow({
  label,
  pickedTeam,
  winnerTeam,
  settled,
}: {
  label: string;
  pickedTeam: TeamLite;
  winnerTeam: TeamLite | null;
  settled: boolean;
}) {
  const correct = settled && winnerTeam && pickedTeam.id === winnerTeam.id;
  const wrong = settled && winnerTeam && pickedTeam.id !== winnerTeam.id;
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-ink/10 px-3 py-2 text-sm">
      <span className="kicker truncate">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: pickedTeam.color }}
          aria-hidden
        />
        <span
          className={`font-semibold ${
            wrong ? "text-ink-soft line-through decoration-ink/30" : "text-ink"
          }`}
        >
          {pickedTeam.name}
        </span>
        {correct && (
          <span className="badge bg-cactus-100 text-cactus-800 border-cactus-300">
            ✓
          </span>
        )}
        {wrong && (
          <span className="badge bg-clay-100 text-clay-800 border-clay-300">
            ✗ {winnerTeam?.name}
          </span>
        )}
        {!settled && <span className="kicker">pending</span>}
      </div>
    </div>
  );
}
