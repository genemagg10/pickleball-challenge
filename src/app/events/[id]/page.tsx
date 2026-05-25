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
            predictions: {
              include: { user: { select: { id: true, name: true } } },
            },
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
                player: { select: { id: true, name: true, isCaptain: true } },
              },
            },
          },
        },
        predictions: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.team.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (!event) notFound();

  const teamById = new Map(teams.map((t) => [t.id, t]));

  const eventTotals: Record<string, number> = {};
  for (const t of teams) eventTotals[t.id] = 0;
  for (const p of event.predictions) {
    if (p.pickedTeamId) eventTotals[p.pickedTeamId] = (eventTotals[p.pickedTeamId] || 0) + 1;
  }
  const eventTotalCount = event.predictions.length;
  const myEventPick = userId
    ? event.predictions.find((p) => p.userId === userId)?.pickedTeamId ?? null
    : null;

  const isCompleted = event.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/events" className="kicker hover:text-ink transition">
          ← All events
        </Link>
        <div className="flex items-start justify-between gap-3 mt-2">
          <div>
            <div className="section-kicker">// Event</div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">{event.name}</h1>
            {event.location && (
              <p className="kicker mt-1">{event.location}</p>
            )}
            {event.startsAt && (
              <p className="kicker">
                {new Date(event.startsAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="text-right text-sm">
            <div className="badge bg-paper-dark text-ink-soft mb-1">
              {event.status.replace("_", " ").toLowerCase()}
            </div>
            <div className="kicker">{event.pointsValue} PTS / MATCHUP</div>
            {session?.user?.isAdmin && (
              <Link
                href={`/admin/events/${event.id}`}
                className="kicker hover:text-ink underline underline-offset-2 mt-1 inline-block"
              >
                Edit / Score
              </Link>
            )}
          </div>
        </div>
        {event.description && (
          <p className="mt-3 text-ink-soft whitespace-pre-wrap">{event.description}</p>
        )}

        {event.winnerTeam && (
          <div
            className="mt-3 rounded-lg p-3 text-sm border"
            style={{
              backgroundColor: event.winnerTeam.color + "12",
              borderColor: event.winnerTeam.color + "40",
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
              <p className="mt-1 text-ink-soft">{event.resultNotes}</p>
            )}
          </div>
        )}

        {event.matchups.length > 0 && (
          <EventScoreBar
            teams={teams}
            matchups={event.matchups}
            pointsValue={event.pointsValue}
          />
        )}
      </div>

      <section>
        <div className="section-kicker">// Market</div>
        <h2 className="text-lg font-bold text-ink tracking-tight mb-2">Event Prediction</h2>
        <PredictionWidget
          endpoint={`/api/events/${event.id}/predict`}
          kicker="Event Pick"
          title="Who wins this event?"
          teams={teams.map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            emoji: t.emoji,
          }))}
          totals={eventTotals}
          totalCount={eventTotalCount}
          myPick={myEventPick}
          locked={isCompleted}
          winnerTeamId={event.winnerTeamId}
          loggedIn={Boolean(userId)}
        />
      </section>

      {event.matchups.length > 0 && (
        <section>
          <div className="section-kicker">// Matchups</div>
          <h2 className="text-lg font-bold text-ink tracking-tight mb-2">Head-to-Head</h2>
          <div className="space-y-3">
            {event.matchups.map((m) => {
              const sidePlayersA = m.participants.filter((p) => p.side === "A").map((p) => p.player);
              const sidePlayersB = m.participants.filter((p) => p.side === "B").map((p) => p.player);
              const matchupTeams = [m.teamA, m.teamB];
              const matchupTotals: Record<string, number> = {
                [m.teamAId]: 0,
                [m.teamBId]: 0,
              };
              for (const p of m.predictions) {
                matchupTotals[p.pickedTeamId] = (matchupTotals[p.pickedTeamId] || 0) + 1;
              }
              const matchupTotalCount = m.predictions.length;
              const myMatchupPick = userId
                ? m.predictions.find((p) => p.userId === userId)?.pickedTeamId ?? null
                : null;
              const matchupLocked = Boolean(m.winnerTeamId) || isCompleted;
              const aWon = m.winnerTeamId === m.teamAId;
              const bWon = m.winnerTeamId === m.teamBId;

              return (
                <div key={m.id} className="card p-3 bg-paper space-y-3">
                  {m.label && <div className="kicker">{m.label}</div>}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 text-sm">
                    <div
                      className={`rounded-md p-2 transition ${
                        bWon ? "opacity-60" : ""
                      }`}
                    >
                      <div className="text-ink font-medium">
                        {m.teamA.emoji}{" "}
                        {sidePlayersA.length === 0
                          ? "—"
                          : sidePlayersA.map((p, i) => (
                              <span key={p.id}>
                                {i > 0 && " & "}
                                <Link
                                  href={`/players/${p.id}`}
                                  className="hover:underline underline-offset-2"
                                >
                                  {p.isCaptain && (
                                    <span aria-label="captain" title="Captain">👑 </span>
                                  )}
                                  {p.name}
                                </Link>
                              </span>
                            ))}
                      </div>
                      <div className="kicker mt-0.5" style={{ color: m.teamA.color }}>
                        {m.teamA.name}
                      </div>
                    </div>
                    <div className="text-center stat-num text-xl text-ink self-center">
                      {m.scoreA ?? "–"} : {m.scoreB ?? "–"}
                    </div>
                    <div
                      className={`rounded-md p-2 text-right transition ${
                        aWon ? "opacity-60" : ""
                      }`}
                    >
                      <div className="text-ink font-medium">
                        {m.teamB.emoji}{" "}
                        {sidePlayersB.length === 0
                          ? "—"
                          : sidePlayersB.map((p, i) => (
                              <span key={p.id}>
                                {i > 0 && " & "}
                                <Link
                                  href={`/players/${p.id}`}
                                  className="hover:underline underline-offset-2"
                                >
                                  {p.isCaptain && (
                                    <span aria-label="captain" title="Captain">👑 </span>
                                  )}
                                  {p.name}
                                </Link>
                              </span>
                            ))}
                      </div>
                      <div className="kicker mt-0.5" style={{ color: m.teamB.color }}>
                        {m.teamB.name}
                      </div>
                    </div>
                  </div>
                  <PredictionWidget
                    endpoint={`/api/matchups/${m.id}/predict`}
                    kicker="Matchup Pick"
                    teams={matchupTeams.map((t) => ({
                      id: t.id,
                      name: t.name,
                      color: t.color,
                      emoji: t.emoji,
                    }))}
                    totals={matchupTotals}
                    totalCount={matchupTotalCount}
                    myPick={myMatchupPick}
                    locked={matchupLocked}
                    winnerTeamId={m.winnerTeamId}
                    loggedIn={Boolean(userId)}
                    compact
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {isCompleted && <HindsightSection event={event} teamById={teamById} />}

      <section>
        <div className="section-kicker">// Chatter</div>
        <h2 className="text-lg font-bold text-ink tracking-tight mb-2">Trash Talk</h2>
        <CommentThread
          eventId={event.id}
          items={event.comments.map((c) => ({
            type: "comment" as const,
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

type TeamLike = { id: string; name: string; color: string; emoji: string | null };

function EventScoreBar({
  teams,
  matchups,
  pointsValue,
}: {
  teams: TeamLike[];
  matchups: { winnerTeamId: string | null }[];
  pointsValue: number;
}) {
  const totalSettled = matchups.filter((m) => m.winnerTeamId).length;
  const totalMatchups = matchups.length;
  const wins: Record<string, number> = {};
  for (const t of teams) wins[t.id] = 0;
  for (const m of matchups) {
    if (m.winnerTeamId && wins[m.winnerTeamId] != null) {
      wins[m.winnerTeamId] += 1;
    }
  }
  const totalAwarded = totalSettled * pointsValue;

  return (
    <div className="mt-3 card p-3 bg-paper">
      <div className="flex items-baseline justify-between mb-2">
        <div className="kicker">Points from this event</div>
        <div className="kicker">
          {totalSettled}/{totalMatchups} MATCHUPS SETTLED · {totalAwarded} PTS AWARDED
        </div>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${teams.length}, minmax(0,1fr))` }}>
        {teams.map((t) => {
          const w = wins[t.id] ?? 0;
          const pts = w * pointsValue;
          return (
            <div
              key={t.id}
              className="rounded-md border border-ink/10 p-2 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: t.color }}
                  aria-hidden
                />
                <span className="font-semibold text-ink truncate">
                  {t.emoji} {t.name}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 shrink-0">
                <span className="stat-num text-xl text-ink">{pts}</span>
                <span className="kicker">{w} WIN{w === 1 ? "" : "S"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type HindsightEvent = {
  winnerTeamId: string | null;
  predictions: {
    userId: string;
    pickedTeamId: string | null;
    user: { id: string; name: string };
  }[];
  matchups: {
    id: string;
    label: string;
    winnerTeamId: string | null;
    predictions: {
      userId: string;
      pickedTeamId: string;
      user: { id: string; name: string };
    }[];
  }[];
};

function HindsightSection({
  event,
  teamById,
}: {
  event: HindsightEvent;
  teamById: Map<string, TeamLike>;
}) {
  type Row = {
    userId: string;
    name: string;
    eventPick: string | null;
    matchupPicks: Record<string, string>;
    correct: number;
    total: number;
  };

  const rows = new Map<string, Row>();
  const ensure = (userId: string, name: string): Row => {
    let r = rows.get(userId);
    if (!r) {
      r = { userId, name, eventPick: null, matchupPicks: {}, correct: 0, total: 0 };
      rows.set(userId, r);
    }
    return r;
  };

  for (const p of event.predictions) {
    if (!p.pickedTeamId) continue;
    const r = ensure(p.userId, p.user.name);
    r.eventPick = p.pickedTeamId;
    r.total += 1;
    if (event.winnerTeamId && p.pickedTeamId === event.winnerTeamId) r.correct += 1;
  }

  const settledMatchups = event.matchups.filter((m) => m.winnerTeamId);
  for (const m of settledMatchups) {
    for (const p of m.predictions) {
      const r = ensure(p.userId, p.user.name);
      r.matchupPicks[m.id] = p.pickedTeamId;
      r.total += 1;
      if (p.pickedTeamId === m.winnerTeamId) r.correct += 1;
    }
  }

  const list = Array.from(rows.values()).sort(
    (a, b) => b.correct - a.correct || a.name.localeCompare(b.name)
  );

  if (list.length === 0) {
    return (
      <section>
        <div className="section-kicker">// Hindsight</div>
        <h2 className="text-lg font-bold text-ink tracking-tight mb-2">Predictions vs Reality</h2>
        <div className="card p-4 bg-paper text-sm text-ink-soft">
          Nobody made a pick for this event.
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="section-kicker">// Hindsight</div>
      <h2 className="text-lg font-bold text-ink tracking-tight mb-2">Predictions vs Reality</h2>
      <div className="card overflow-x-auto bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10">
              <th className="text-left p-3 kicker">Player</th>
              <th className="text-left p-3 kicker">Event Pick</th>
              {settledMatchups.map((m, i) => (
                <th key={m.id} className="text-left p-3 kicker">
                  {m.label || `M${i + 1}`}
                </th>
              ))}
              <th className="text-right p-3 kicker">Score</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.userId} className="border-b border-ink/5 last:border-0">
                <td className="p-3 font-semibold text-ink">{r.name}</td>
                <td className="p-3">
                  <PickCell
                    pickId={r.eventPick}
                    winnerId={event.winnerTeamId}
                    teamById={teamById}
                  />
                </td>
                {settledMatchups.map((m) => (
                  <td key={m.id} className="p-3">
                    <PickCell
                      pickId={r.matchupPicks[m.id] ?? null}
                      winnerId={m.winnerTeamId}
                      teamById={teamById}
                    />
                  </td>
                ))}
                <td className="p-3 text-right stat-num text-base text-ink">
                  {r.correct}/{r.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PickCell({
  pickId,
  winnerId,
  teamById,
}: {
  pickId: string | null;
  winnerId: string | null;
  teamById: Map<string, TeamLike>;
}) {
  if (!pickId) {
    return <span className="kicker">—</span>;
  }
  const team = teamById.get(pickId);
  const correct = winnerId && pickId === winnerId;
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${
        correct ? "text-ink" : "text-ink-soft line-through decoration-ink/30"
      }`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: team?.color ?? "#999" }}
        aria-hidden
      />
      <span>{team?.name ?? "?"}</span>
      <span className="text-xs">{correct ? "✓" : "✗"}</span>
    </span>
  );
}
