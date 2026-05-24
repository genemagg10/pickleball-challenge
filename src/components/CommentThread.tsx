"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Comment = {
  id: string;
  body: string;
  createdAt: string | Date;
  user: { id: string; name: string };
};

type Props = {
  eventId: string | null;
  comments: Comment[];
  loggedIn: boolean;
  currentUserId?: string;
};

export function CommentThread({ eventId, comments, loggedIn, currentUserId }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId, body: text }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not post comment.");
      return;
    }
    setBody("");
    router.refresh();
  }

  async function deleteComment(id: string) {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500">No comments yet — start the trash talk.</p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">{c.user.name}</span>
                <span className="text-xs text-slate-500">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-slate-700 whitespace-pre-wrap">{c.body}</p>
              {currentUserId === c.user.id && (
                <div className="mt-1 text-right">
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {loggedIn ? (
        <form onSubmit={onSubmit} className="card p-3 space-y-2">
          <textarea
            className="input min-h-20"
            placeholder="Bring the heat…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            required
          />
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate-500">
          <a href="/login" className="text-court underline">
            Sign in
          </a>{" "}
          to join the chat.
        </p>
      )}
    </div>
  );
}
