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
  const diff = Math.abs(a.points - b.points);
  const total = a.points + b.points;
  const aPct = total === 0 ? 50 : Math.round((a.points / total) * 100);
  return (
    <div className="card overflow-hidden bg-paper">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        <TeamCell t={a} leading={leader?.teamId === a.teamId} />
        <div className="flex flex-col items-center justify-center px-3 py-4 min-w-[96px] border-x border-ink/10">
          <div className="kicker">Status</div>
          <div className="mt-1 text-2xl" aria-hidden>
            {leader ? "🔥" : "⚖️"}
          </div>
          <div className="mt-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink">
            {leader ? `+${diff} LEAD` : "TIED"}
          </div>
        </div>
        <TeamCell t={b} leading={leader?.teamId === b.teamId} />
      </div>
      <div className="h-1.5 flex">
        <div style={{ width: `${aPct}%`, backgroundColor: a.color }} />
        <div style={{ flex: 1, backgroundColor: b.color }} />
      </div>
    </div>
  );
}

function TeamCell({ t, leading }: { t: TeamStanding; leading: boolean }) {
  return (
    <div className="p-4 text-center flex flex-col items-center justify-between gap-1">
      <div className="kicker flex items-center justify-center gap-1.5 flex-wrap">
        <span aria-hidden>{t.emoji ?? "■"}</span>
        <span>{t.name}</span>
      </div>
      <div
        className="stat-num text-5xl mt-1 leading-none tabular-nums"
        style={{ color: t.color }}
      >
        {t.points}
      </div>
      <div className="kicker mt-1 flex items-center justify-center gap-1">
        {leading && <span aria-hidden>👑</span>}
        <span>
          {t.matchupsWon} MATCHUP{t.matchupsWon === 1 ? "" : "S"} WON
        </span>
      </div>
    </div>
  );
}
