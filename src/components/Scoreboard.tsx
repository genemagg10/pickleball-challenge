import type { TeamStanding } from "@/lib/scoring";

export function Scoreboard({
  standings,
  finalized = false,
}: {
  standings: TeamStanding[];
  finalized?: boolean;
}) {
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
  const champion = finalized ? leader : null;
  return (
    <div className="card overflow-hidden bg-paper">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        <TeamCell t={a} champion={champion?.teamId === a.teamId} />
        <div className="flex flex-col items-center justify-center px-3 py-4 min-w-[96px] border-x border-ink/10">
          <div className="kicker">Status</div>
          <div className="mt-1 text-2xl" aria-hidden>
            {champion ? "🏆" : leader ? "🔥" : "⚖️"}
          </div>
          <div className="mt-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink">
            {champion ? "FINAL" : leader ? `+${diff} LEAD` : "TIED"}
          </div>
        </div>
        <TeamCell t={b} champion={champion?.teamId === b.teamId} />
      </div>
      <div className="h-1.5 flex">
        <div style={{ width: `${aPct}%`, backgroundColor: a.color }} />
        <div style={{ flex: 1, backgroundColor: b.color }} />
      </div>
    </div>
  );
}

function TeamCell({ t, champion }: { t: TeamStanding; champion: boolean }) {
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
        {champion && <span aria-hidden>👑</span>}
        <span>
          {t.matchupsWon} MATCHUP{t.matchupsWon === 1 ? "" : "S"} WON
        </span>
      </div>
    </div>
  );
}
