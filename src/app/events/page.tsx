import Link from "next/link";
import { prisma } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { auth } from "@/lib/auth";
import { MatchupsByEventBar } from "./EventCharts";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const session = await auth();
  const [events, teams] = await Promise.all([
    prisma.event.findMany({
      include: {
        winnerTeam: true,
        matchups: { select: { winnerTeamId: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.team.findMany({
      select: { id: true, name: true, color: true, emoji: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Bar chart data: matchups won per team per event, only for events
  // with at least one settled matchup
  const chartData = events
    .map((e) => {
      const row: Record<string, string | number> = { event: e.name };
      let settled = 0;
      for (const t of teams) row[t.name] = 0;
      for (const m of e.matchups) {
        if (!m.winnerTeamId) continue;
        const team = teams.find((t) => t.id === m.winnerTeamId);
        if (team) {
          row[team.name] = (row[team.name] as number) + 1;
          settled += 1;
        }
      }
      return { row, settled };
    })
    .filter((x) => x.settled > 0)
    .map((x) => x.row);

  const totalEvents = events.length;
  const completed = events.filter((e) => e.status === "COMPLETED").length;
  const inProgress = events.filter((e) => e.status === "IN_PROGRESS").length;
  const upcoming = events.filter((e) => e.status === "UPCOMING").length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-kicker">// Schedule</div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">All Events</h1>
          <p className="kicker mt-1">
            {totalEvents} TOTAL · {completed} DONE · {inProgress} LIVE · {upcoming} UPCOMING
          </p>
        </div>
        {session?.user?.isAdmin && (
          <Link href="/admin/events/new" className="btn-primary">
            + New event
          </Link>
        )}
      </div>

      {chartData.length > 0 && (
        <section>
          <div className="section-kicker">// Head-to-head</div>
          <h2 className="text-lg font-bold text-ink tracking-tight mb-2">
            Matchups won per event
          </h2>
          <div className="card p-4 bg-paper">
            <MatchupsByEventBar
              data={chartData}
              teams={teams.map((t) => ({ name: t.name, color: t.color }))}
            />
            <p className="kicker mt-2">
              Each event&apos;s matchup wins by team. Only events with at least one
              settled matchup are shown.
            </p>
          </div>
        </section>
      )}

      {events.length === 0 ? (
        <div className="card p-6 text-center text-ink-soft text-sm bg-paper">
          No events yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} teams={teams} />
          ))}
        </div>
      )}
    </div>
  );
}
