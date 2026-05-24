"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Team = {
  id: string;
  name: string;
  color: string;
  emoji: string | null;
};

export function TeamAdmin({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#1d4ed8");
  const [emoji, setEmoji] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/teams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, color, emoji: emoji || null }),
    });
    setBusy(false);
    setName("");
    setEmoji("");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this team? Players will be unassigned.")) return;
    await fetch(`/api/teams/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function update(id: string, patch: Partial<Team>) {
    await fetch(`/api/teams/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    router.refresh();
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="space-y-2">
        {teams.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center gap-2">
            <input
              className="input flex-1 min-w-40"
              defaultValue={t.name}
              onBlur={(e) =>
                e.target.value !== t.name && update(t.id, { name: e.target.value })
              }
            />
            <input
              className="input w-24"
              defaultValue={t.emoji ?? ""}
              placeholder="🔵"
              onBlur={(e) => update(t.id, { emoji: e.target.value || null })}
            />
            <input
              type="color"
              className="h-10 w-12 rounded border border-slate-300"
              defaultValue={t.color}
              onBlur={(e) => update(t.id, { color: e.target.value })}
            />
            <button onClick={() => remove(t.id)} className="btn-danger">
              Delete
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={create} className="flex flex-wrap items-end gap-2 pt-2 border-t border-slate-200">
        <div className="flex-1 min-w-40">
          <label className="label">Team name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Emoji</label>
          <input
            className="input w-24"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="🟢"
          />
        </div>
        <div>
          <label className="label">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-12 rounded border border-slate-300"
          />
        </div>
        <button className="btn-primary" disabled={busy}>
          + Add team
        </button>
      </form>
    </div>
  );
}
