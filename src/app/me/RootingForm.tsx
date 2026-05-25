"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Team = { id: string; name: string; color: string; emoji: string | null };
type Player = { id: string; name: string; teamId: string; team: Team };

export function RootingForm({
  teams,
  players,
  initialTeamId,
  initialPlayerId,
}: {
  teams: Team[];
  players: Player[];
  initialTeamId: string | null;
  initialPlayerId: string | null;
}) {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(initialTeamId);
  const [playerId, setPlayerId] = useState<string | null>(initialPlayerId);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const teamPlayers = teamId ? players.filter((p) => p.teamId === teamId) : [];

  function pickTeam(id: string | null) {
    setTeamId(id);
    // Clear player if it doesn't belong to the new team
    if (id !== teamId) setPlayerId(null);
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/me/rooting", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ teamId, playerId }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(data.error || "Could not save.");
      return;
    }
    setMsg("Saved.");
    router.refresh();
  }

  async function clearAll() {
    setTeamId(null);
    setPlayerId(null);
    setBusy(true);
    await fetch("/api/me/rooting", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ teamId: null, playerId: null }),
    });
    setBusy(false);
    setMsg("Cleared.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="label">Team</div>
        <div className="grid grid-cols-2 gap-2">
          {teams.map((t) => {
            const selected = teamId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => pickTeam(selected ? null : t.id)}
                className={`rounded-lg border p-3 text-left transition ${
                  selected
                    ? "ring-2 ring-court border-court"
                    : "border-slate-200 hover:border-slate-400"
                }`}
                style={selected ? { borderColor: t.color } : undefined}
              >
                <div className="font-semibold" style={{ color: t.color }}>
                  {t.emoji} {t.name}
                </div>
                <div className="text-xs text-slate-500">
                  {selected ? "Cheering for them" : "Tap to root for"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {teamId && (
        <div>
          <div className="label">Favorite player (optional)</div>
          {teamPlayers.length === 0 ? (
            <p className="text-xs text-slate-500">No players on this team yet.</p>
          ) : (
            <select
              className="input"
              value={playerId ?? ""}
              onChange={(e) => setPlayerId(e.target.value || null)}
            >
              <option value="">— no favorite —</option>
              {teamPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {msg && <span className="text-xs text-slate-500 mr-auto">{msg}</span>}
        <button onClick={clearAll} className="btn-secondary" disabled={busy}>
          Clear
        </button>
        <button onClick={save} className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
