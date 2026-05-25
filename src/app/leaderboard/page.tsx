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
          select: { championPickTeamId: true },
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
