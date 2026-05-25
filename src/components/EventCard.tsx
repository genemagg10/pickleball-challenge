import Link from "next/link";
import type { Event, Team } from "@prisma/client";

type EventWithWinner = Event & { winnerTeam: Team | null };

const statusStyles: Record<string, string> = {
  UPCOMING: "bg-paper-dark text-ink-soft border-ink/15",
  IN_PROGRESS: "bg-amber-100 text-amber-800 border-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export function EventCard({ event }: { event: EventWithWinner }) {
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
    </Link>
  );
}
