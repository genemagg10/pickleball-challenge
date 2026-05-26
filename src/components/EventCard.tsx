import Link from "next/link";
import type { Event, Team } from "@prisma/client";

type MatchupLite = {
  winnerTeamId: string | null;
  predictions: { pickedTeamId: string }[];
};

type EventWithScoring = Event & {
  winnerTeam: Team | null;
  matchups: MatchupLite[];
};

type TeamLite = { id: string; name: string; color: string; emoji: string | null };

const statusStyles: Record<string, string> = {
  UPCOMING: "bg-paper-dark text-ink-soft border-ink/15",
  IN_PROGRESS: "bg-sun-100 text-sun-800 border-sun-300",
  COMPLETED: "bg-cactus-100 text-cactus-800 border-cactus-300",
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
  const picks: Record<string, number> = {};
  for (const t of teams) {
    wins[t.id] = 0;
    picks[t.id] = 0;
  }
  let totalPicks = 0;
  for (const m of event.matchups) {
    if (m.winnerTeamId && wins[m.winnerTeamId] != null) wins[m.winnerTeamId] += 1;
    for (const p of m.predictions) {
      if (picks[p.pickedTeamId] != null) {
        picks[p.pickedTeamId] += 1;
        totalPicks += 1;
      }
    }
  }

  const twoTeams = teams.length >= 2;
  const teamA = twoTeams ? teams[0] : null;
  const teamB = twoTeams ? teams[1] : null;

  const outlookAPct =
    twoTeams && totalPicks > 0
      ? Math.round(((picks[teamA!.id] || 0) / totalPicks) * 100)
      : null;
  const resultTotal = twoTeams ? (wins[teamA!.id] || 0) + (wins[teamB!.id] || 0) : 0;
  const resultAPct =
    twoTeams && resultTotal > 0
      ? Math.round(((wins[teamA!.id] || 0) / resultTotal) * 100)
      : null;

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

      {twoTeams && (outlookAPct != null || resultAPct != null) && (
        <div className="mt-3 space-y-2">
          {outlookAPct != null && (
            <SplitBar
              label="Outlook"
              meta={`${totalPicks} PICK${totalPicks === 1 ? "" : "S"}`}
              teamA={teamA!}
              teamB={teamB!}
              aPct={outlookAPct}
              aCount={picks[teamA!.id] || 0}
              bCount={picks[teamB!.id] || 0}
              countLabel="picks"
            />
          )}
          {resultAPct != null && (
            <SplitBar
              label="Result"
              meta={`${settled}/${totalMatchups} SETTLED`}
              teamA={teamA!}
              teamB={teamB!}
              aPct={resultAPct}
              aCount={wins[teamA!.id] || 0}
              bCount={wins[teamB!.id] || 0}
              countLabel="wins"
              emphasized
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="kicker">{event.pointsValue} PTS / MATCHUP</span>
        {event.winnerTeam ? (
          <span
            className="font-semibold text-sm"
            style={{ color: event.winnerTeam.color }}
          >
            Won by {event.winnerTeam.name}
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

function SplitBar({
  label,
  meta,
  teamA,
  teamB,
  aPct,
  aCount,
  bCount,
  countLabel,
  emphasized = false,
}: {
  label: string;
  meta: string;
  teamA: TeamLite;
  teamB: TeamLite;
  aPct: number;
  aCount: number;
  bCount: number;
  countLabel: string;
  emphasized?: boolean;
}) {
  const bPct = 100 - aPct;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${
            emphasized ? "text-ink" : "text-ink-soft"
          }`}
        >
          {label}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
          {meta}
        </span>
      </div>
      <div
        className={`mt-1 flex w-full ${
          emphasized ? "h-2.5" : "h-1.5"
        } rounded-full overflow-hidden bg-ink/5`}
        title={`${teamA.name} ${aPct}% · ${teamB.name} ${bPct}%`}
      >
        <div style={{ width: `${aPct}%`, backgroundColor: teamA.color }} />
        <div style={{ flex: 1, backgroundColor: teamB.color }} />
      </div>
      <div className="mt-1 flex items-baseline justify-between text-[11px] tabular-nums">
        <span className="font-semibold" style={{ color: teamA.color }}>
          {aPct}%
          <span className="kicker ml-1">
            {aCount} {countLabel}
          </span>
        </span>
        <span className="font-semibold" style={{ color: teamB.color }}>
          <span className="kicker mr-1">
            {bCount} {countLabel}
          </span>
          {bPct}%
        </span>
      </div>
    </div>
  );
}
