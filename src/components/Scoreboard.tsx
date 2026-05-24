import type { TeamStanding } from "@/lib/scoring";

export function Scoreboard({ standings }: { standings: TeamStanding[] }) {
  if (standings.length < 2) {
    return (
      <div className="card p-4 text-sm text-slate-500">
        Add at least two teams to see the scoreboard.
      </div>
    );
  }
  const [a, b] = standings;
  const leader = a.points === b.points ? null : a.points > b.points ? a : b;
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-3 items-center">
        <TeamCell t={a} leading={leader?.teamId === a.teamId} />
        <div className="text-center">
          <div className="text-xs uppercase tracking-wide text-slate-500">Score</div>
          <div className="text-sm font-medium text-slate-600">
            {leader ? `${leader.name} lead` : "Tied"}
          </div>
        </div>
        <TeamCell t={b} leading={leader?.teamId === b.teamId} align="right" />
      </div>
    </div>
  );
}

function TeamCell({
  t,
  leading,
  align = "left",
}: {
  t: TeamStanding;
  leading: boolean;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`p-4 ${align === "right" ? "text-right" : ""} ${
        leading ? "bg-slate-50" : ""
      }`}
      style={{ borderTop: `4px solid ${t.color}` }}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {t.emoji} {t.name}
      </div>
      <div className="text-4xl font-bold tabular-nums" style={{ color: t.color }}>
        {t.points}
      </div>
      <div className="text-xs text-slate-500">{t.eventsWon} event{t.eventsWon === 1 ? "" : "s"} won</div>
    </div>
  );
}
