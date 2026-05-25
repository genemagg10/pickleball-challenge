import Link from "next/link";
import type { Event, Team } from "@prisma/client";

type EventWithScoring = Event & {
  winnerTeam: Team | null;
  matchups: { winnerTeamId: string | null }[];
};

type TeamLite = { id: string; name: string; color: string; emoji: string | null };

const statusStyles: Record<string, string> = {
  UPCOMING: "bg-paper-dark text-ink-soft border-ink/15",
  IN_PROGRESS: "bg-amber-100 text-amber-800 border-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export function EventCard({
  event,
  teams,
}: {
  event: EventWithScoring;
  teams: TeamLite[];
}) {
  const totalMatchups = event.matchups.length;
  const settled = event.matchups.filter((m) => m.winnerTeamId).length;
  const wins: Record<string, number> = {};
  for (const t of teams) wins[t.id] = 0;
  for (const m of event.matchups) {
    if (m.winnerTeamId && wins[m.winnerTeamId] != null) wins[m.winnerTeamId] += 1;
  }
  const showScore = settled > 0;

  return (
    <Link
      href={`/events/${event.id}`}
      className="card block p-4 bg-paper hover:border-ink/40 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-base text-ink truncate">{event.name}</h3>
          {event.location && (
            <div className="kicker mt-0.5">{event.location}</div>
          )}
        </div>
        <span className={`badge ${statusStyles[event.status]}`}>
          {event.status.replace("_", " ").toLowerCase()}
        </span>
      </div>
      {event.description && (
        <p className="text-sm text-ink-soft mt-2 line-clamp-2">{event.description}</p>
      )}
      <div className="flex items-center justify-between mt-3">
        <span className="kicker">{event.pointsValue} PTS / MATCHUP</span>
        {event.winnerTeam ? (
          <span
            className="font-semibold text-sm"
            style={{ color: event.winnerTeam.color }}
          >
            Won by {event.winnerTeam.emoji} {event.winnerTeam.name}
            {event.scoreA != null && event.scoreB != null
              ? ` · ${event.scoreA}-${event.scoreB}`
              : ""}
          </span>
        ) : event.startsAt ? (
          <span className="kicker">{new Date(event.startsAt).toLocaleString()}</span>
        ) : null}
      </div>
      {showScore && (
        <div className="mt-3 pt-3 border-t border-ink/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            {teams.map((t) => (
              <span key={t.id} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: t.color }}
                  aria-hidden
                />
                <span className="stat-num text-base text-ink">
                  {wins[t.id] * event.pointsValue}
                </span>
              </span>
            ))}
          </div>
          <span className="kicker">
            {settled}/{totalMatchups} SETTLED
          </span>
        </div>
      )}
    </Link>
  );
}
