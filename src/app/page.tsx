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
      include: {
        winnerTeam: true,
        matchups: { select: { winnerTeamId: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 6,
    }),
    prisma.comment.findMany({
      where: { eventId: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            rootingForTeam: true,
            rootingForPlayer: { select: { id: true, name: true, teamId: true } },
            player: { select: { id: true, name: true } },
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
    <div className="space-y-8">
      <section>
        <SectionHeader
          kicker="Live"
          title="Scoreboard"
          link={{ href: "/leaderboard", label: "Picks leaderboard" }}
        />
        <Scoreboard standings={standings} />
        {noTeams && (
          <div className="text-sm text-ink-soft mt-2">
            An admin needs to set up the two teams in /admin before scoring works.
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          kicker="Schedule"
          title="Events"
          link={{ href: "/events", label: "View all" }}
        />
        {events.length === 0 ? (
          <div className="card p-6 text-center text-ink-soft text-sm bg-paper">
            No events yet.{" "}
            <Link href="/admin" className="text-ink underline underline-offset-2">
              Add one in admin
            </Link>
            .
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} teams={teams} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          kicker="Chatter"
          title="Lounge"
          link={{ href: "/lounge", label: "All trash talk" }}
        />
        <div className="card p-4 space-y-3 bg-paper">
          {recentComments.length === 0 ? (
            <p className="text-sm text-ink-soft">
              No trash talk yet. Be the first.{" "}
              <Link href="/lounge" className="text-ink underline underline-offset-2">
                Open the lounge
              </Link>
              .
            </p>
          ) : (
            recentComments.map((c) => (
              <div key={c.id} className="text-sm">
                {c.user.player ? (
                  <Link
                    href={`/players/${c.user.player.id}`}
                    className="font-semibold text-ink hover:underline underline-offset-2"
                  >
                    {c.user.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-ink">{c.user.name}</span>
                )}{" "}
                <FanBadge
                  team={c.user.rootingForTeam}
                  player={c.user.rootingForPlayer}
                  size="xs"
                />
                <span className="text-ink-soft">: {c.body}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  link,
}: {
  kicker: string;
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between mb-2">
      <div>
        <div className="section-kicker">// {kicker}</div>
        <h2 className="text-2xl font-bold text-ink tracking-tight">{title}</h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="kicker hover:text-ink transition"
        >
          {link.label} →
        </Link>
      )}
    </div>
  );
}
