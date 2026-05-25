"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Team = { id: string; name: string; color: string; emoji: string | null };
type Player = { id: string; name: string; teamId: string };
type Matchup = {
  id: string;
  label: string;
  teamAId: string;
  teamBId: string;
  scoreA: number | null;
  scoreB: number | null;
  winnerTeamId: string | null;
  participants: { playerId: string; side: string; player: { id: string; name: string } }[];
};

export function MatchupEditor({
  event,
  teams,
  players,
}: {
  event: { id: string; matchups: Matchup[] };
  teams: Team[];
  players: Player[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("");

  async function addMatchup() {
    if (teams.length < 2) return;
    setBusy(true);
    await fetch(`/api/events/${event.id}/matchups`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label,
        teamAId: teams[0].id,
        teamBId: teams[1].id,
      }),
    });
    setBusy(false);
    setLabel("");
    router.refresh();
  }

  async function update(matchupId: string, patch: object) {
    await fetch(`/api/matchups/${matchupId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    router.refresh();
  }

  async function remove(matchupId: string) {
    if (!confirm("Delete this matchup?")) return;
    await fetch(`/api/matchups/${matchupId}`, { method: "DELETE" });
    router.refresh();
  }

  async function setParticipants(matchupId: string, side: "A" | "B", playerIds: string[]) {
    await fetch(`/api/matchups/${matchupId}/participants`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ side, playerIds }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {event.matchups.length === 0 ? (
        <p className="text-sm text-slate-500">No matchups yet.</p>
      ) : (
        event.matchups.map((m) => {
          const teamA = teams.find((t) => t.id === m.teamAId);
          const teamB = teams.find((t) => t.id === m.teamBId);
          const sideA = m.participants.filter((p) => p.side === "A").map((p) => p.playerId);
          const sideB = m.participants.filter((p) => p.side === "B").map((p) => p.playerId);
          const teamAPlayers = players.filter((p) => p.teamId === m.teamAId);
          const teamBPlayers = players.filter((p) => p.teamId === m.teamBId);
          return (
            <div key={m.id} className="card p-3 space-y-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-40">
                  <label className="label">Label (e.g. &quot;Game 1&quot;)</label>
                  <input
                    className="input"
                    defaultValue={m.label}
                    onBlur={(e) => e.target.value !== m.label && update(m.id, { label: e.target.value })}
                  />
                </div>
                <button onClick={() => remove(m.id)} className="btn-danger">
                  Delete
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-medium" style={{ color: teamA?.color }}>
                    {teamA?.emoji} {teamA?.name}
                  </div>
                  <PlayerMultiSelect
                    players={teamAPlayers}
                    selected={sideA}
                    onChange={(ids) => setParticipants(m.id, "A", ids)}
                  />
                </div>
                <div>
                  <div className="text-xs font-medium" style={{ color: teamB?.color }}>
                    {teamB?.emoji} {teamB?.name}
                  </div>
                  <PlayerMultiSelect
                    players={teamBPlayers}
                    selected={sideB}
                    onChange={(ids) => setParticipants(m.id, "B", ids)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 items-end">
                <div>
                  <label className="label">Score {teamA?.name}</label>
                  <input
                    type="number"
                    className="input"
                    defaultValue={m.scoreA ?? ""}
                    onBlur={(e) =>
                      update(m.id, { scoreA: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="label">Score {teamB?.name}</label>
                  <input
                    type="number"
                    className="input"
                    defaultValue={m.scoreB ?? ""}
                    onBlur={(e) =>
                      update(m.id, { scoreB: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="label">Winner</label>
                  <select
                    className="input"
                    defaultValue={m.winnerTeamId ?? ""}
                    onChange={(e) => update(m.id, { winnerTeamId: e.target.value || null })}
                  >
                    <option value="">—</option>
                    <option value={m.teamAId}>{teamA?.name}</option>
                    <option value={m.teamBId}>{teamB?.name}</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })
      )}

      <div className="card p-3 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-40">
          <label className="label">Matchup label</label>
          <input
            className="input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Game 1"
          />
        </div>
        <button onClick={addMatchup} disabled={busy || teams.length < 2} className="btn-primary">
          + Add matchup
        </button>
      </div>
    </div>
  );
}

function PlayerMultiSelect({
  players,
  selected,
  onChange,
}: {
  players: Player[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (players.length === 0) {
    return <p className="text-xs text-slate-500 mt-1">No players on this team.</p>;
  }
  return (
    <div className="mt-1 space-y-1">
      {players.map((p) => {
        const checked = selected.includes(p.id);
        return (
          <label key={p.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, p.id]
                  : selected.filter((id) => id !== p.id);
                onChange(next);
              }}
            />
            <span>{p.name}</span>
          </label>
        );
      })}
    </div>
  );
}
