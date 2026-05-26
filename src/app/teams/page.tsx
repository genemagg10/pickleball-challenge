import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CrowdDonut } from "./TeamCharts";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await auth();

  const teams = await prisma.team.findMany({
    include: {
      players: {
        orderBy: { name: "asc" },
        include: {
          user: { select: { name: true } },
          matchupParticipations: {
            where: { matchup: { winnerTeamId: { not: null } } },
            include: {
              matchup: {
                select: {
                  id: true,
                  winnerTeamId: true,
                  event: { select: { pointsValue: true } },
                },
              },
            },
          },
          _count: { select: { fans: true } },
        },
      },
      _count: { select: { fans: true, championPicks: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Winning-matchup participation per player, plus each team's real totals.
  // Team points are summed once per distinct winning matchup so doubles
  // partners don't double-count toward the team total (matches the scoreboard).
  const winsByPlayer = new Map<string, number>();
  const teamTotals = new Map<string, { wins: number; points: number }>();
  for (const t of teams) {
    const wonMatchupPts = new Map<string, number>();
    for (const p of t.players) {
      let pWins = 0;
      for (const mp of p.matchupParticipations) {
        if (mp.matchup.winnerTeamId !== t.id) continue;
        pWins += 1;
        wonMatchupPts.set(mp.matchup.id, mp.matchup.event.pointsValue);
      }
      winsByPlayer.set(p.id, pWins);
    }
    let points = 0;
    for (const v of wonMatchupPts.values()) points += v;
    teamTotals.set(t.id, { wins: wonMatchupPts.size, points });
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="section-kicker">// Rosters</div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Teams</h1>
          </div>
          {session?.user?.isAdmin && (
            <Link href="/admin" className="btn-secondary">
              Manage in admin
            </Link>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {teams.map((t) => {
            const totals = teamTotals.get(t.id) ?? { wins: 0, points: 0 };
            const sortedPlayers = [...t.players].sort((a, b) => {
              const aWins = winsByPlayer.get(a.id) ?? 0;
              const bWins = winsByPlayer.get(b.id) ?? 0;
              return bWins - aWins || a.name.localeCompare(b.name);
            });
            return (
              <div
                key={t.id}
                className="card overflow-hidden bg-paper"
                style={{ borderTop: `4px solid ${t.color}` }}
              >
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold" style={{ color: t.color }}>
                      {t.emoji} {t.name}
                    </h3>
                    <span className="stat-num text-xl text-ink">
                      {totals.points}{" "}
                      <span className="kicker">PTS</span>
                    </span>
                  </div>
                  <p className="kicker mt-0.5">
                    {t.players.length} player{t.players.length === 1 ? "" : "s"} ·{" "}
                    {totals.wins} matchup{totals.wins === 1 ? "" : "s"} won ·{" "}
                    {t._count.fans} fan{t._count.fans === 1 ? "" : "s"} ·{" "}
                    {t._count.championPicks} champion pick
                    {t._count.championPicks === 1 ? "" : "s"}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {sortedPlayers.length === 0 ? (
                      <li className="text-ink-soft">No players yet.</li>
                    ) : (
                      sortedPlayers.map((p) => {
                        const pWins = winsByPlayer.get(p.id) ?? 0;
                        const pct =
                          totals.wins === 0 ? 0 : (pWins / totals.wins) * 100;
                        return (
                          <li key={p.id}>
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                href={`/players/${p.id}`}
                                className="text-ink font-medium hover:underline underline-offset-2 min-w-0 truncate flex items-center gap-1"
                              >
                                <span className="truncate">{p.name}</span>
                                {p.isCaptain && (
                                  <span
                                    aria-label="Team captain"
                                    title={`Captain of ${t.name}`}
                                  >
                                    👑
                                  </span>
                                )}
                              </Link>
                              <span className="flex items-center gap-2 text-xs shrink-0">
                                {p.user && (
                                  <span className="kicker">@{p.user.name}</span>
                                )}
                                <span className="font-semibold text-ink tabular-nums">
                                  {pWins}
                                  <span className="text-ink-soft">
                                    /{totals.wins}
                                  </span>{" "}
                                  <span className="kicker">WINS</span>
                                </span>
                              </span>
                            </div>
                            <div
                              className="mt-1 h-1 w-full bg-ink/5 rounded-full overflow-hidden"
                              title={`In ${pWins} of ${totals.wins} winning matchups`}
                            >
                              <div
                                className="h-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: t.color,
                                }}
                              />
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="section-kicker">// Crowd</div>
        <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">
          Fan pulse
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="card p-4 bg-paper">
            <div className="kicker mb-2">Who&apos;s rooting for who</div>
            <CrowdDonut
              data={teams.map((t) => ({
                name: t.name,
                value: t._count.fans,
                color: t.color,
              }))}
            />
          </div>
          <div className="card p-4 bg-paper">
            <div className="kicker mb-2">Overall champion picks</div>
            <CrowdDonut
              data={teams.map((t) => ({
                name: t.name,
                value: t._count.championPicks,
                color: t.color,
              }))}
            />
          </div>
        </div>
      </section>

      {session?.user && (
        <p className="kicker">
          Pick who you&apos;re cheering for in{" "}
          <Link href="/me" className="text-ink underline underline-offset-2">
            your profile
          </Link>
          .
        </p>
      )}
    </div>
  );
}
