"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Team = { id: string; name: string; emoji: string | null };
type User = { id: string; name: string; email: string };
type Player = {
  id: string;
  name: string;
  teamId: string;
  isCaptain: boolean;
  team: { name: string };
  user: { id: string; name: string; email: string } | null;
};

export function PlayerAdmin({
  teams,
  players,
  users,
}: {
  teams: Team[];
  players: Player[];
  users: User[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId) return;
    setBusy(true);
    await fetch("/api/players", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, teamId, userId: userId || null }),
    });
    setBusy(false);
    setName("");
    setUserId("");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this player?")) return;
    await fetch(`/api/players/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function update(
    id: string,
    patch: Partial<{ teamId: string; userId: string | null; name: string; isCaptain: boolean }>
  ) {
    await fetch(`/api/players/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    router.refresh();
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="space-y-2">
        {players.length === 0 ? (
          <p className="text-sm text-slate-500">No players yet.</p>
        ) : (
          players.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 items-center"
            >
              <input
                className="input"
                defaultValue={p.name}
                onBlur={(e) => e.target.value !== p.name && update(p.id, { name: e.target.value })}
              />
              <select
                className="input"
                defaultValue={p.teamId}
                onChange={(e) => update(p.id, { teamId: e.target.value })}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.emoji} {t.name}
                  </option>
                ))}
              </select>
              <select
                className="input"
                defaultValue={p.user?.id ?? ""}
                onChange={(e) => update(p.id, { userId: e.target.value || null })}
              >
                <option value="">— unlinked —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <label
                className="flex items-center gap-1.5 text-sm whitespace-nowrap select-none"
                title="Team captain"
              >
                <input
                  type="checkbox"
                  defaultChecked={p.isCaptain}
                  onChange={(e) => update(p.id, { isCaptain: e.target.checked })}
                />
                <span aria-hidden>🧢</span>
                <span>Captain</span>
              </label>
              <button onClick={() => remove(p.id)} className="btn-danger">
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={create}
        className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-200"
      >
        <div>
          <label className="label">Player name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Team</label>
          <select
            className="input"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            required
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Link to user</label>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">— none —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn-primary w-full" disabled={busy || !teamId}>
            + Add player
          </button>
        </div>
      </form>
    </div>
  );
}
