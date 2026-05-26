import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStandings } from "@/lib/scoring";
import { Scoreboard } from "@/components/Scoreboard";
import { EventCard } from "@/components/EventCard";
import { FanBadge } from "@/components/FanBadge";
import { getLoungeFeed } from "@/lib/loungeFeed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    standings,
    events,
    feedItems,
    teams,
    totalEvents,
    openEvents,
    openMatchups,
  ] = await Promise.all([
    getStandings(),
    prisma.event.findMany({
      include: {
        winnerTeam: true,
        matchups: {
          select: {
            winnerTeamId: true,
            predictions: { select: { pickedTeamId: true } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 6,
    }),
    getLoungeFeed({ take: 5 }),
    prisma.team.findMany({ include: { _count: { select: { players: true } } } }),
    prisma.event.count(),
    prisma.event.count({ where: { status: { not: "COMPLETED" } } }),
    prisma.matchup.count({ where: { winnerTeamId: null } }),
  ]);

  const noTeams = teams.length < 2;
  const tournamentFinalized =
    totalEvents > 0 && openEvents === 0 && openMatchups === 0;

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          kicker="Live"
          title="Scoreboard"
          link={{ href: "/leaderboard", label: "Picks leaderboard" }}
        />
        <Scoreboard standings={standings} finalized={tournamentFinalized} />
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
        {feedItems.length === 0 ? (
          <div className="card p-4 bg-white text-sm text-ink-soft">
            No trash talk yet. Be the first.{" "}
            <Link href="/lounge" className="text-ink underline underline-offset-2">
              Open the lounge
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-2">
            {feedItems.map((item) => {
              if (item.type === "event_completed") {
                return (
                  <FeedBanner
                    key={item.id}
                    href={`/events/${item.event.id}`}
                    color={item.winnerTeam.color}
                    icon="🏆"
                    title={`${item.event.name} · ${item.winnerTeam.emoji ?? ""} ${item.winnerTeam.name} won`}
                    subtitle={
                      item.scoreA != null && item.scoreB != null
                        ? `final ${item.scoreA}-${item.scoreB}`
                        : "event complete"
                    }
                  />
                );
              }
              if (item.type === "matchup_completed") {
                return (
                  <FeedBanner
                    key={item.id}
                    href={`/events/${item.event.id}`}
                    color={item.winnerTeam.color}
                    icon="🏓"
                    title={`${item.label || "Matchup"} · ${item.winnerTeam.emoji ?? ""} ${item.winnerTeam.name} won`}
                    subtitle={
                      item.scoreA != null && item.scoreB != null
                        ? `${item.scoreA}-${item.scoreB} · in ${item.event.name}`
                        : `in ${item.event.name}`
                    }
                  />
                );
              }
              return (
                <div key={item.id} className="card p-3 bg-white text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.user.player ? (
                      <Link
                        href={`/players/${item.user.player.id}`}
                        className="font-semibold text-ink hover:underline underline-offset-2 flex items-center gap-1"
                      >
                        <span>{item.user.name}</span>
                        {item.user.player.isCaptain && (
                          <span aria-label="captain" title="Captain">👑</span>
                        )}
                      </Link>
                    ) : (
                      <span className="font-semibold text-ink">{item.user.name}</span>
                    )}
                    <FanBadge
                      team={item.user.rootingForTeam}
                      player={item.user.rootingForPlayer}
                      size="xs"
                    />
                    {item.event && (
                      <Link
                        href={`/events/${item.event.id}`}
                        className="badge bg-paper-dark text-ink-soft hover:text-ink"
                        title={`From event: ${item.event.name}`}
                      >
                        <span aria-hidden>#</span>
                        <span className="truncate max-w-[180px]">{item.event.name}</span>
                      </Link>
                    )}
                  </div>
                  <p className="mt-1 text-ink line-clamp-2 whitespace-pre-wrap">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function FeedBanner({
  href,
  color,
  icon,
  title,
  subtitle,
}: {
  href: string;
  color: string;
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="card block p-3 bg-white text-sm hover:border-ink/40 transition"
      style={{ boxShadow: `inset 4px 0 0 ${color}` }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-lg" aria-hidden>{icon}</span>
        <span className="font-semibold text-ink">{title}</span>
      </div>
      <p className="kicker mt-0.5">{subtitle}</p>
    </Link>
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
