import type { TeamStanding } from "@/lib/scoring";

export function Scoreboard({ standings }: { standings: TeamStanding[] }) {
  if (standings.length < 2) {
    return (
      <div className="card p-4 text-sm text-ink-soft">
        Add at least two teams to see the scoreboard.
      </div>
    );
  }
  const [a, b] = standings;
  const leader = a.points === b.points ? null : a.points > b.points ? a : b;
  const total = a.points + b.points;
  const aPct = total === 0 ? 50 : Math.round((a.points / total) * 100);
  return (
    <div className="card overflow-hidden bg-paper">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        <TeamCell t={a} leading={leader?.teamId === a.teamId} />
        <div className="flex flex-col items-center justify-center px-4 py-4 min-w-[110px] border-x border-ink/10">
          <div className="kicker">Status</div>
          <div className="mt-1 font-mono text-sm font-semibold text-ink">
            {leader ? `${leader.name.toUpperCase()} LEAD` : "TIED"}
          </div>
        </div>
        <TeamCell t={b} leading={leader?.teamId === b.teamId} align="right" />
      </div>
      <div className="h-1.5 flex">
        <div style={{ width: `${aPct}%`, backgroundColor: a.color }} />
        <div style={{ flex: 1, backgroundColor: b.color }} />
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
    <div className={`p-4 ${align === "right" ? "text-right" : ""}`}>
      <div className={`kicker flex items-center gap-1.5 ${align === "right" ? "justify-end" : ""}`}>
        <span aria-hidden>{t.emoji ?? "■"}</span>
        <span>{t.name}</span>
        {leading && <span className="text-[10px] text-ink">▲ LEAD</span>}
      </div>
      <div className="stat-num text-5xl mt-1" style={{ color: t.color }}>
        {t.points}
      </div>
      <div className="kicker mt-1">
        {t.eventsWon} EVENT{t.eventsWon === 1 ? "" : "S"} WON
      </div>
    </div>
  );
}
