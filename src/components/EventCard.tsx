import Link from "next/link";
import type { Event, Team } from "@prisma/client";

type EventWithWinner = Event & { winnerTeam: Team | null };

const statusStyles: Record<string, string> = {
  UPCOMING: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
};

export function EventCard({ event }: { event: EventWithWinner }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="card block p-4 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base">{event.name}</h3>
          {event.location && (
            <div className="text-xs text-slate-500">{event.location}</div>
          )}
        </div>
        <span className={`badge ${statusStyles[event.status]}`}>
          {event.status.replace("_", " ").toLowerCase()}
        </span>
      </div>
      {event.description && (
        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{event.description}</p>
      )}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>Worth {event.pointsValue} pts</span>
        {event.winnerTeam ? (
          <span
            className="font-semibold"
            style={{ color: event.winnerTeam.color }}
          >
            Won by {event.winnerTeam.emoji} {event.winnerTeam.name}
            {event.scoreA != null && event.scoreB != null
              ? ` · ${event.scoreA}-${event.scoreB}`
              : ""}
          </span>
        ) : event.startsAt ? (
          <span>{new Date(event.startsAt).toLocaleString()}</span>
        ) : null}
      </div>
    </Link>
  );
}
