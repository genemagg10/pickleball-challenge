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
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-bold mb-2">Overall Championship</h1>
        <PredictionWidget
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
        <h2 className="text-xl font-bold mb-2">Picks Leaderboard</h2>
        <div className="card overflow-hidden">
          {leaderboard.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No completed events yet — leaderboard will fill in once events finish.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Player</th>
                  <th className="p-3 text-right">Correct</th>
                  <th className="p-3 text-right">Of</th>
                  <th className="p-3 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr key={row.userId} className="border-t border-slate-200">
                    <td className="p-3 font-semibold">{i + 1}</td>
                    <td className="p-3">{row.name}</td>
                    <td className="p-3 text-right tabular-nums">{row.correct}</td>
                    <td className="p-3 text-right tabular-nums">{row.total}</td>
                    <td className="p-3 text-right tabular-nums">
                      {Math.round(row.accuracy * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
