import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStandings } from "@/lib/scoring";
import { Scoreboard } from "@/components/Scoreboard";
import { EventCard } from "@/components/EventCard";
import { FanBadge } from "@/components/FanBadge";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [standings, events, recentComments, teams] = await Promise.all([
    getStandings(),
    prisma.event.findMany({
      include: { winnerTeam: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 6,
    }),
    prisma.comment.findMany({
      where: { eventId: null },
      include: {
        user: {
          select: {
            name: true,
            rootingForTeam: true,
            rootingForPlayer: { select: { id: true, name: true, teamId: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.team.findMany({ include: { _count: { select: { players: true } } } }),
  ]);

  const noTeams = teams.length < 2;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-end justify-between mb-2">
          <h1 className="text-xl font-bold">Live Scoreboard</h1>
          <Link href="/leaderboard" className="text-sm text-court hover:underline">
            Picks leaderboard →
          </Link>
        </div>
        <Scoreboard standings={standings} />
        {noTeams && (
          <div className="text-sm text-slate-500 mt-2">
            An admin needs to set up the two teams in /admin before scoring works.
          </div>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-xl font-bold">Events</h2>
          <Link href="/events" className="text-sm text-court hover:underline">
            View all →
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="card p-6 text-center text-slate-500 text-sm">
            No events yet.{" "}
            <Link href="/admin" className="text-court underline">
              Add one in admin
            </Link>
            .
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-xl font-bold">Lounge</h2>
          <Link href="/lounge" className="text-sm text-court hover:underline">
            All trash talk →
          </Link>
        </div>
        <div className="card p-4 space-y-3">
          {recentComments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No trash talk yet. Be the first.{" "}
              <Link href="/lounge" className="text-court underline">
                Open the lounge
              </Link>
              .
            </p>
          ) : (
            recentComments.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="font-semibold">{c.user.name}</span>{" "}
                <FanBadge
                  team={c.user.rootingForTeam}
                  player={c.user.rootingForPlayer}
                  size="xs"
                />
                <span className="text-slate-700">: {c.body}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
