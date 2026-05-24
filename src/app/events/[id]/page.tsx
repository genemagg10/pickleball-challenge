import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PredictionWidget } from "@/components/PredictionWidget";
import { CommentThread } from "@/components/CommentThread";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const [event, teams] = await Promise.all([
    prisma.event.findUnique({
      where: { id: params.id },
      include: {
        winnerTeam: true,
        matchups: {
          orderBy: { sortOrder: "asc" },
          include: {
            teamA: true,
            teamB: true,
            winnerTeam: true,
            participants: { include: { player: true } },
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                rootingForTeam: true,
                rootingForPlayer: {
                  select: { id: true, name: true, teamId: true },
                },
              },
            },
          },
        },
        predictions: { select: { userId: true, pickedTeamId: true } },
      },
    }),
    prisma.team.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (!event) notFound();

  const totals: Record<string, number> = {};
  for (const t of teams) totals[t.id] = 0;
  for (const p of event.predictions) {
    if (p.pickedTeamId) totals[p.pickedTeamId] = (totals[p.pickedTeamId] || 0) + 1;
  }
  const totalCount = event.predictions.length;
  const myPick =
    userId
      ? event.predictions.find((p) => p.userId === userId)?.pickedTeamId ?? null
      : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/events" className="text-sm text-court hover:underline">
          ← All events
        </Link>
        <div className="flex items-start justify-between gap-3 mt-2">
          <div>
            <h1 className="text-2xl font-bold">{event.name}</h1>
            {event.location && (
              <p className="text-sm text-slate-500">{event.location}</p>
            )}
            {event.startsAt && (
              <p className="text-sm text-slate-500">
                {new Date(event.startsAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="text-right text-sm">
            <div className="badge bg-slate-100 text-slate-700 mb-1">
              {event.status.replace("_", " ").toLowerCase()}
            </div>
            <div className="text-slate-600">Worth {event.pointsValue} pts</div>
            {session?.user?.isAdmin && (
              <Link
                href={`/admin/events/${event.id}`}
                className="text-court text-xs underline mt-1 inline-block"
              >
                Edit / Score
              </Link>
            )}
          </div>
        </div>
        {event.description && (
          <p className="mt-2 text-slate-700 whitespace-pre-wrap">{event.description}</p>
        )}

        {event.winnerTeam && (
          <div
            className="mt-3 rounded-lg p-3 text-sm"
            style={{
              backgroundColor: event.winnerTeam.color + "1a",
              color: event.winnerTeam.color,
            }}
          >
            <strong>
              {event.winnerTeam.emoji} {event.winnerTeam.name} won
            </strong>
            {event.scoreA != null && event.scoreB != null && (
              <span> · final {event.scoreA}-{event.scoreB}</span>
            )}
            {event.resultNotes && (
              <p className="mt-1 text-slate-700">{event.resultNotes}</p>
            )}
          </div>
        )}
      </div>

      {event.matchups.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Matchups</h2>
          <div className="space-y-2">
            {event.matchups.map((m) => {
              const sideA = m.participants
                .filter((p) => p.side === "A")
                .map((p) => p.player.name)
                .join(" & ");
              const sideB = m.participants
                .filter((p) => p.side === "B")
                .map((p) => p.player.name)
                .join(" & ");
              return (
                <div key={m.id} className="card p-3">
                  {m.label && (
                    <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                      {m.label}
                    </div>
                  )}
                  <div className="grid grid-cols-3 items-center text-sm">
                    <div
                      className={`font-medium ${
                        m.winnerTeamId === m.teamAId ? "" : "text-slate-700"
                      }`}
                      style={{
                        color: m.winnerTeamId === m.teamAId ? m.teamA.color : undefined,
                      }}
                    >
                      <div>{m.teamA.emoji} {sideA || "—"}</div>
                      <div className="text-xs text-slate-500">{m.teamA.name}</div>
                    </div>
                    <div className="text-center tabular-nums font-bold text-lg">
                      {m.scoreA ?? "–"} : {m.scoreB ?? "–"}
                    </div>
                    <div
                      className={`text-right font-medium ${
                        m.winnerTeamId === m.teamBId ? "" : "text-slate-700"
                      }`}
                      style={{
                        color: m.winnerTeamId === m.teamBId ? m.teamB.color : undefined,
                      }}
                    >
                      <div>{m.teamB.emoji} {sideB || "—"}</div>
                      <div className="text-xs text-slate-500">{m.teamB.name}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">Prediction</h2>
        <PredictionWidget
          eventId={event.id}
          teams={teams.map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            emoji: t.emoji,
          }))}
          totals={totals}
          totalCount={totalCount}
          myPick={myPick}
          locked={event.status === "COMPLETED"}
          winnerTeamId={event.winnerTeamId}
          loggedIn={Boolean(userId)}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Trash Talk</h2>
        <CommentThread
          eventId={event.id}
          comments={event.comments.map((c) => ({
            id: c.id,
            body: c.body,
            createdAt: c.createdAt.toISOString(),
            user: c.user,
          }))}
          loggedIn={Boolean(userId)}
          currentUserId={userId}
        />
      </section>
    </div>
  );
}
