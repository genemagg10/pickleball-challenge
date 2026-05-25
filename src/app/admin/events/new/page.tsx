"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    startsAt: "",
    pointsValue: 5,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "Could not create event.");
      return;
    }
    const data = await res.json();
    router.push(`/admin/events/${data.id}`);
  }

  return (
    <div className="max-w-xl mx-auto card p-6">
      <h1 className="text-xl font-bold mb-4">New event</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
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
        <div className="grid grid-cols-2 gap-3">
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
        </div>
        <div>
          <label className="label">Points per matchup</label>
          <input
            type="number"
            min={1}
            className="input w-32"
            value={form.pointsValue}
            onChange={(e) =>
              setForm({ ...form, pointsValue: Number(e.target.value) || 1 })
            }
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex justify-end">
          <button className="btn-primary" disabled={busy}>
            {busy ? "Creating…" : "Create event"}
          </button>
        </div>
      </form>
    </div>
  );
}
