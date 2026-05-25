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
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-semibold">
          {eventId ? "Who wins this event?" : "Who wins the whole thing?"}
        </h3>
        <span className="text-xs text-slate-500">
          {totalCount} pick{totalCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-2">
        {teams.map((t) => {
          const count = totals[t.id] || 0;
          const pct = totalCount === 0 ? 0 : Math.round((count / totalCount) * 100);
          const isWinner = winnerTeamId === t.id;
          const isMine = myPick === t.id;
          return (
            <button
              key={t.id}
              disabled={locked || pending !== null || !loggedIn}
              onClick={() => pick(t.id)}
              className={`relative w-full text-left rounded-lg border p-3 overflow-hidden transition ${
                isMine ? "border-court ring-2 ring-court" : "border-slate-200"
              } ${locked || !loggedIn ? "opacity-90" : "hover:border-slate-400"}`}
            >
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${pct}%`,
                  backgroundColor: t.color,
                  opacity: 0.18,
                }}
                aria-hidden
              />
              <div className="relative flex items-center justify-between gap-3">
                <div className="font-medium" style={{ color: t.color }}>
                  {t.emoji} {t.name}
                  {isWinner && (
                    <span className="ml-2 badge bg-emerald-100 text-emerald-800">
                      Winner
                    </span>
                  )}
                </div>
                <div className="text-sm tabular-nums">
                  {pct}% <span className="text-slate-500">· {count}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-slate-500">
        {!loggedIn ? (
          <a href="/login" className="text-court underline">
            Sign in to make a pick
          </a>
        ) : locked ? (
          "Picks are locked — event is final."
        ) : myPick ? (
          "Your pick is saved. Tap another to change it."
        ) : (
          "Tap a team to lock in your pick."
        )}
      </div>
    </div>
  );
}
