"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FanBadge } from "@/components/FanBadge";

type TeamLite = { id: string; name: string; color: string; emoji: string | null };
type PlayerLite = { id: string; name: string; teamId: string };

type CommentItem = {
  type: "comment";
  id: string;
  body: string;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    rootingForTeam: TeamLite | null;
    rootingForPlayer: PlayerLite | null;
    player?: { id: string; name: string; isCaptain?: boolean } | null;
  };
  event?: { id: string; name: string } | null;
};

type EventCompletedItem = {
  type: "event_completed";
  id: string;
  createdAt: string | Date;
  event: { id: string; name: string };
  winnerTeam: TeamLite;
  scoreA: number | null;
  scoreB: number | null;
};

type MatchupCompletedItem = {
  type: "matchup_completed";
  id: string;
  createdAt: string | Date;
  event: { id: string; name: string };
  label: string;
  winnerTeam: TeamLite;
  scoreA: number | null;
  scoreB: number | null;
  sideAPlayers: { id: string; name: string }[];
  sideBPlayers: { id: string; name: string }[];
};

export type FeedItem = CommentItem | EventCompletedItem | MatchupCompletedItem;

type Props = {
  eventId: string | null;
  items: FeedItem[];
  loggedIn: boolean;
  currentUserId?: string;
  emptyText?: string;
};

export function CommentThread({
  eventId,
  items,
  loggedIn,
  currentUserId,
  emptyText,
}: Props) {
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
        {items.length === 0 ? (
          <p className="text-sm text-ink-soft">
            {emptyText ?? "No comments yet — start the trash talk."}
          </p>
        ) : (
          items.map((item) => {
            if (item.type === "event_completed") {
              return (
                <EventCompletedCard key={item.id} item={item} />
              );
            }
            if (item.type === "matchup_completed") {
              return (
                <MatchupCompletedCard key={item.id} item={item} />
              );
            }
            return (
              <CommentCard
                key={item.id}
                item={item}
                showEventTag={eventId === null}
                canDelete={currentUserId === item.user.id}
                onDelete={() => deleteComment(item.id)}
              />
            );
          })
        )}
      </div>

      {loggedIn ? (
        <form onSubmit={onSubmit} className="card p-3 space-y-2 bg-white">
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
        <p className="text-sm text-ink-soft">
          <a href="/login" className="text-ink underline underline-offset-2">
            Sign in
          </a>{" "}
          to join the chat.
        </p>
      )}
    </div>
  );
}

function CommentCard({
  item,
  showEventTag,
  canDelete,
  onDelete,
}: {
  item: CommentItem;
  showEventTag: boolean;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {item.user.player ? (
            <Link
              href={`/players/${item.user.player.id}`}
              className="font-semibold text-ink hover:underline underline-offset-2 flex items-center gap-1"
            >
              <span>{item.user.name}</span>
              {item.user.player.isCaptain && (
                <span aria-label="captain" title="Team captain">👑</span>
              )}
            </Link>
          ) : (
            <span className="font-semibold text-ink">{item.user.name}</span>
          )}
          <FanBadge
            team={item.user.rootingForTeam}
            player={item.user.rootingForPlayer}
            size="xs"
          />
          {showEventTag && item.event && (
            <Link
              href={`/events/${item.event.id}`}
              className="badge bg-paper-dark text-ink-soft hover:text-ink"
              title={`From event: ${item.event.name}`}
            >
              <span aria-hidden>#</span>
              <span className="truncate max-w-[180px]">{item.event.name}</span>
            </Link>
          )}
        </div>
        <span className="kicker">
          {new Date(item.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-1 text-ink whitespace-pre-wrap">{item.body}</p>
      {canDelete && (
        <div className="mt-1 text-right">
          <button
            onClick={onDelete}
            className="text-xs text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function EventCompletedCard({ item }: { item: EventCompletedItem }) {
  const color = item.winnerTeam.color;
  return (
    <div
      className="rounded-lg border bg-white p-3 text-sm"
      style={{ borderColor: color + "40", boxShadow: `inset 4px 0 0 ${color}` }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge bg-cactus-100 text-cactus-800 border-cactus-300">
            <span aria-hidden>🏆</span>
            <span>Event complete</span>
          </span>
          <Link
            href={`/events/${item.event.id}`}
            className="font-semibold text-ink hover:underline underline-offset-2"
          >
            {item.event.name}
          </Link>
        </div>
        <span className="kicker">
          {new Date(item.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-1 text-ink">
        <span aria-hidden>{item.winnerTeam.emoji} </span>
        <span className="font-semibold" style={{ color }}>
          {item.winnerTeam.name}
        </span>{" "}
        won
        {item.scoreA != null && item.scoreB != null && (
          <span className="kicker"> · final {item.scoreA}-{item.scoreB}</span>
        )}
      </p>
    </div>
  );
}

function MatchupCompletedCard({ item }: { item: MatchupCompletedItem }) {
  const color = item.winnerTeam.color;
  const partners = [...item.sideAPlayers, ...item.sideBPlayers]
    .map((p) => p.name)
    .join(" / ");
  return (
    <div
      className="rounded-lg border bg-white p-3 text-sm"
      style={{ borderColor: color + "40", boxShadow: `inset 4px 0 0 ${color}` }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge bg-paper-dark text-ink-soft">
            <span aria-hidden>🏓</span>
            <span>Matchup complete</span>
          </span>
          <Link
            href={`/events/${item.event.id}`}
            className="badge bg-paper-dark text-ink-soft hover:text-ink"
            title={`Event: ${item.event.name}`}
          >
            <span aria-hidden>#</span>
            <span className="truncate max-w-[180px]">{item.event.name}</span>
          </Link>
        </div>
        <span className="kicker">
          {new Date(item.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-1 text-ink">
        {item.label && <span className="kicker mr-1">{item.label} ·</span>}
        <span aria-hidden>{item.winnerTeam.emoji} </span>
        <span className="font-semibold" style={{ color }}>
          {item.winnerTeam.name}
        </span>{" "}
        won
        {item.scoreA != null && item.scoreB != null && (
          <span className="kicker"> · {item.scoreA}-{item.scoreB}</span>
        )}
      </p>
      {partners && (
        <p className="kicker mt-0.5 truncate">{partners}</p>
      )}
    </div>
  );
}
