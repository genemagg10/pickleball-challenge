import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Scoreboard } from "@/components/Scoreboard";
import { getStandings } from "@/lib/scoring";
import { CrowdDonut, MatchupsByEventBar } from "./TeamCharts";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await auth();

  const [teams, standings, events] = await Promise.all([
    prisma.team.findMany({
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
    }),
    getStandings(),
    prisma.event.findMany({
      include: {
        matchups: {
          where: { winnerTeamId: { not: null } },
          select: { winnerTeamId: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  // Points contributed per player, computed once
  const pointsByPlayer = new Map<string, number>();
  for (const t of teams) {
    for (const p of t.players) {
      const pts = p.matchupParticipations
        .filter((mp) => mp.matchup.winnerTeamId === t.id)
        .reduce((s, mp) => s + mp.matchup.event.pointsValue, 0);
      pointsByPlayer.set(p.id, pts);
    }
  }
  const maxPts = Math.max(1, ...Array.from(pointsByPlayer.values()));

  // Bar chart: matchups won per event (one bar per team)
  const eventChartData = events
    .filter((e) => e.matchups.length > 0)
    .map((e) => {
      const row: Record<string, string | number> = { event: e.name };
      for (const t of teams) row[t.name] = 0;
      for (const m of e.matchups) {
        const team = teams.find((t) => t.id === m.winnerTeamId);
        if (team) row[team.name] = (row[team.name] as number) + 1;
      }
      return row;
    });

  return (
    <div className="space-y-8">
      <section>
        <div className="section-kicker">// Live</div>
        <h1 className="text-2xl font-bold text-ink tracking-tight mb-2">
          Scoreboard
        </h1>
        <Scoreboard standings={standings} />
      </section>

      {eventChartData.length > 0 && (
        <section>
          <div className="section-kicker">// Head-to-head</div>
          <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">
            Matchups won per event
          </h2>
          <div className="card p-4 bg-paper">
            <MatchupsByEventBar
              data={eventChartData}
              teams={teams.map((t) => ({ name: t.name, color: t.color }))}
            />
          </div>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="section-kicker">// Rosters</div>
            <h2 className="text-2xl font-bold text-ink tracking-tight">Teams</h2>
          </div>
          {session?.user?.isAdmin && (
            <Link href="/admin" className="btn-secondary">
              Manage in admin
            </Link>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {teams.map((t) => {
            const sortedPlayers = [...t.players].sort((a, b) => {
              const aPts = pointsByPlayer.get(a.id) ?? 0;
              const bPts = pointsByPlayer.get(b.id) ?? 0;
              return bPts - aPts || a.name.localeCompare(b.name);
            });
            const teamTotalPts = sortedPlayers.reduce(
              (s, p) => s + (pointsByPlayer.get(p.id) ?? 0),
              0
            );
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
                      {teamTotalPts}{" "}
                      <span className="kicker">PTS</span>
                    </span>
                  </div>
                  <p className="kicker mt-0.5">
                    {t.players.length} player{t.players.length === 1 ? "" : "s"} ·{" "}
                    {t._count.fans} fan{t._count.fans === 1 ? "" : "s"} ·{" "}
                    {t._count.championPicks} champion pick
                    {t._count.championPicks === 1 ? "" : "s"}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {sortedPlayers.length === 0 ? (
                      <li className="text-ink-soft">No players yet.</li>
                    ) : (
                      sortedPlayers.map((p) => {
                        const pts = pointsByPlayer.get(p.id) ?? 0;
                        const pct = (pts / maxPts) * 100;
                        return (
                          <li key={p.id}>
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                href={`/players/${p.id}`}
                                className="text-ink font-medium hover:underline underline-offset-2 min-w-0 truncate"
                              >
                                {p.name}
                              </Link>
                              <span className="flex items-center gap-2 text-xs shrink-0">
                                {p.user && (
                                  <span className="kicker">@{p.user.name}</span>
                                )}
                                <span className="font-semibold text-ink tabular-nums">
                                  {pts}{" "}
                                  <span className="kicker">PTS</span>
                                </span>
                              </span>
                            </div>
                            <div className="mt-1 h-1 w-full bg-ink/5 rounded-full overflow-hidden">
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
