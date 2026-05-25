"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Team = { id: string; name: string; color: string; emoji: string | null };
type Event = {
  id: string;
  name: string;
  description: string;
  location: string;
  startsAt: Date | null;
  pointsValue: number;
  status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED";
  winnerTeamId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  resultNotes: string | null;
};

function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 16);
}

export function EventEditor({ event, teams }: { event: Event; teams: Team[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: event.name,
    description: event.description,
    location: event.location,
    startsAt: toLocalInput(event.startsAt),
    pointsValue: event.pointsValue,
    status: event.status,
    winnerTeamId: event.winnerTeamId ?? "",
    scoreA: event.scoreA ?? "",
    scoreB: event.scoreB ?? "",
    resultNotes: event.resultNotes ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        location: form.location,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        pointsValue: Number(form.pointsValue) || 1,
        status: form.status,
        winnerTeamId: form.winnerTeamId || null,
        scoreA: form.scoreA === "" ? null : Number(form.scoreA),
        scoreB: form.scoreB === "" ? null : Number(form.scoreB),
        resultNotes: form.resultNotes || null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg("Saved.");
      router.refresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(data.error || "Save failed.");
    }
  }

  async function remove() {
    if (!confirm("Delete this event? Matchups and predictions will be removed.")) return;
    const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin");
  }

  return (
    <div className="card p-4 space-y-3">
      <div>
        <label className="label">Name</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-24"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Location</label>
          <input
            className="input"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Starts at</label>
          <input
            type="datetime-local"
            className="input"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Points per matchup</label>
          <input
            type="number"
            min={1}
            className="input"
            value={form.pointsValue}
            onChange={(e) => setForm({ ...form, pointsValue: Number(e.target.value) || 1 })}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as Event["status"],
              })
            }
          >
            <option value="UPCOMING">Upcoming</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div>
          <label className="label">Winner</label>
          <select
            className="input"
            value={form.winnerTeamId}
            onChange={(e) => setForm({ ...form, winnerTeamId: e.target.value })}
          >
            <option value="">— none —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Score A</label>
          <input
            className="input"
            type="number"
            value={form.scoreA}
            onChange={(e) =>
              setForm({ ...form, scoreA: e.target.value as unknown as number })
            }
          />
        </div>
        <div>
          <label className="label">Score B</label>
          <input
            className="input"
            type="number"
            value={form.scoreB}
            onChange={(e) =>
              setForm({ ...form, scoreB: e.target.value as unknown as number })
            }
          />
        </div>
      </div>
      <div>
        <label className="label">Result notes</label>
        <textarea
          className="input"
          value={form.resultNotes}
          onChange={(e) => setForm({ ...form, resultNotes: e.target.value })}
        />
      </div>
      <p className="text-xs text-slate-500">
        Marking <strong>Completed</strong> with a winner locks predictions and awards
        the event&apos;s points to the winner.
      </p>
      <div className="flex items-center gap-2 justify-end">
        {msg && <span className="text-xs text-slate-500 mr-auto">{msg}</span>}
        <button onClick={remove} className="btn-danger">
          Delete event
        </button>
        <button onClick={save} className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
