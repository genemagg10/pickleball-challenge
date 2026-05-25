"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Team = { id: string; name: string; color: string; emoji: string | null };

type Props = {
  eventId?: string; // omit for overall championship picks
  teams: Team[];
  totals: Record<string, number>;
  totalCount: number;
  myPick: string | null;
  locked: boolean;
  winnerTeamId?: string | null;
  loggedIn: boolean;
};

export function PredictionWidget({
  eventId,
  teams,
  totals,
  totalCount,
  myPick,
  locked,
  winnerTeamId,
  loggedIn,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function pick(teamId: string) {
    if (locked || !loggedIn) return;
    setPending(teamId);
    const endpoint = eventId
      ? `/api/events/${eventId}/predict`
      : `/api/predict/overall`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    setPending(null);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="card p-4 bg-paper">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="kicker">Prediction Market</div>
          <h3 className="font-semibold text-ink mt-0.5">
            {eventId ? "Who wins this event?" : "Who wins the whole thing?"}
          </h3>
        </div>
        <span className="kicker">
          {totalCount} PICK{totalCount === 1 ? "" : "S"}
        </span>
      </div>
      <div className="space-y-2">
        {teams.map((t) => {
          const count = totals[t.id] || 0;
          const pct = totalCount === 0 ? 0 : Math.round((count / totalCount) * 100);
          const isWinner = winnerTeamId === t.id;
          const isMine = myPick === t.id;
          const isPending = pending === t.id;
          return (
            <button
              key={t.id}
              disabled={locked || pending !== null || !loggedIn}
              onClick={() => pick(t.id)}
              className={`relative w-full text-left rounded-lg border p-3 transition ${
                isMine
                  ? "border-ink bg-paper-dark/60"
                  : "border-ink/10 bg-paper hover:border-ink/40"
              } ${locked || !loggedIn ? "opacity-90 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: t.color }}
                    aria-hidden
                  />
                  <span className="font-semibold text-ink truncate">
                    {t.emoji} {t.name}
                  </span>
                  {isWinner && (
                    <span className="badge bg-emerald-100 text-emerald-800 border-emerald-300">
                      Won
                    </span>
                  )}
                  {isMine && !isWinner && (
                    <span className="badge bg-ink text-paper border-ink">Your pick</span>
                  )}
                  {isPending && (
                    <span className="kicker">…saving</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="stat-num text-2xl text-ink">{pct}%</span>
                  <span className="kicker">{count}</span>
                </div>
              </div>
              <div className="mt-2 h-1 w-full bg-ink/5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: t.color }}
                />
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-3 kicker">
        {!loggedIn ? (
          <a href="/login" className="text-ink underline underline-offset-2">
            Sign in to make a pick
          </a>
        ) : locked ? (
          "Picks locked — event is final."
        ) : myPick ? (
          "Your pick is saved. Tap another to change it."
        ) : (
          "Tap a team to lock in your pick."
        )}
      </div>
    </div>
  );
}
