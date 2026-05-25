import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  PickAccuracyDonut,
  PointsByEventBar,
  WinLossDonut,
} from "./PlayerCharts";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: {
      team: true,
      user: { select: { id: true, name: true, createdAt: true } },
      _count: { select: { fans: true } },
      matchupParticipations: {
        include: {
          matchup: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  pointsValue: true,
                  sortOrder: true,
                  status: true,
                },
              },
              teamA: true,
              teamB: true,
              winnerTeam: true,
              participants: { include: { player: true } },
            },
          },
        },
      },
    },
  });

  if (!player) notFound();

  // Sort participations by event sort order, then matchup createdAt
  const participations = [...player.matchupParticipations].sort((a, b) => {
    const aOrder = a.matchup.event.sortOrder;
    const bOrder = b.matchup.event.sortOrder;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.matchup.createdAt < b.matchup.createdAt ? -1 : 1;
  });

  // Matchup stats
  let wins = 0;
  let losses = 0;
  let pending = 0;
  let ptsWon = 0;
  let ptsLost = 0;
  const eventBuckets = new Map<
    string,
    { event: string; points: number; lost: number }
  >();

  for (const mp of participations) {
    const m = mp.matchup;
    const eventName = m.event.name;
    if (!eventBuckets.has(m.event.id)) {
      eventBuckets.set(m.event.id, { event: eventName, points: 0, lost: 0 });
    }
    const bucket = eventBuckets.get(m.event.id)!;
    if (m.winnerTeamId == null) {
      pending += 1;
    } else if (m.winnerTeamId === player.teamId) {
      wins += 1;
      ptsWon += m.event.pointsValue;
      bucket.points += m.event.pointsValue;
    } else {
      losses += 1;
      ptsLost += m.event.pointsValue;
      bucket.lost += m.event.pointsValue;
    }
  }
  const settled = wins + losses;
  const winRate = settled === 0 ? null : Math.round((wins / settled) * 100);
  const pointsByEvent = Array.from(eventBuckets.values()).filter(
    (b) => b.points + b.lost > 0
  );

  // Linked user data (picks, comments)
  const userData = player.user?.id
    ? await prisma.user.findUnique({
        where: { id: player.user.id },
        include: {
          championPickTeam: true,
          predictions: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  winnerTeamId: true,
                  winnerTeam: true,
                },
              },
              pickedTeam: true,
            },
          },
          matchupPredictions: {
            include: {
              matchup: {
                include: {
                  event: { select: { id: true, name: true } },
                  winnerTeam: true,
                },
              },
              pickedTeam: true,
            },
          },
          comments: {
            include: {
              event: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 12,
          },
          _count: { select: { comments: true } },
        },
      })
    : null;

  let pickCorrect = 0;
  let pickWrong = 0;
  if (userData) {
    for (const p of userData.predictions) {
      if (
        !p.pickedTeamId ||
        p.event.status !== "COMPLETED" ||
        !p.event.winnerTeamId
      )
        continue;
      if (p.pickedTeamId === p.event.winnerTeamId) pickCorrect += 1;
      else pickWrong += 1;
    }
    for (const mp of userData.matchupPredictions) {
      if (!mp.matchup.winnerTeamId) continue;
      if (mp.pickedTeamId === mp.matchup.winnerTeamId) pickCorrect += 1;
      else pickWrong += 1;
    }
  }

  // Group participations by event
  const matchupsByEvent = new Map<
    string,
    {
      eventId: string;
      eventName: string;
      sortOrder: number;
      matchups: typeof participations;
    }
  >();
  for (const mp of participations) {
    const eId = mp.matchup.event.id;
    if (!matchupsByEvent.has(eId)) {
      matchupsByEvent.set(eId, {
        eventId: eId,
        eventName: mp.matchup.event.name,
        sortOrder: mp.matchup.event.sortOrder,
        matchups: [],
      });
    }
    matchupsByEvent.get(eId)!.matchups.push(mp);
  }
  const eventGroups = Array.from(matchupsByEvent.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/teams" className="kicker hover:text-ink transition">
          ← All players
        </Link>
        <div className="mt-2 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="section-kicker">// Player</div>
            <h1 className="text-3xl font-bold text-ink tracking-tight flex items-center gap-2 flex-wrap">
              {player.name}
              {player.isCaptain && (
                <span
                  className="text-xl"
                  title={`Captain of ${player.team.name}`}
                  aria-label="Team captain"
                >
                  👑
                </span>
              )}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: player.team.color }}
                aria-hidden
              />
              <span className="font-semibold" style={{ color: player.team.color }}>
                {player.team.emoji} {player.team.name}
              </span>
              {player.isCaptain && (
                <span className="kicker">· 👑 CAPTAIN</span>
              )}
              {player.user && (
                <span className="kicker">· @{player.user.name}</span>
              )}
              {player._count.fans > 0 && (
                <span className="kicker">
                  · 🙌 {player._count.fans} fan{player._count.fans === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Matchups" value={String(participations.length)} sub={`${settled} SETTLED`} />
          <Stat
            label="Win rate"
            value={winRate == null ? "—" : `${winRate}%`}
            sub={`${wins}W · ${losses}L`}
          />
          <Stat
            label="Pts won for team"
            value={String(ptsWon)}
            sub={`${ptsLost} CONCEDED`}
            valueColor={player.team.color}
          />
          {userData ? (
            <Stat
              label="Pick accuracy"
              value={
                pickCorrect + pickWrong === 0
                  ? "—"
                  : `${Math.round(
                      (pickCorrect / (pickCorrect + pickWrong)) * 100
                    )}%`
              }
              sub={`${pickCorrect}/${pickCorrect + pickWrong} CORRECT`}
            />
          ) : (
            <Stat
              label="Account"
              value="—"
              sub="NOT LINKED"
            />
          )}
        </div>
      </section>

      <section
        className={`grid grid-cols-1 sm:grid-cols-2 ${
          userData ? "lg:grid-cols-4" : ""
        } gap-3`}
      >
        <div className="card p-4 bg-paper">
          <div className="kicker mb-2">Matchup record</div>
          <WinLossDonut
            wins={wins}
            losses={losses}
            pending={pending}
            teamColor={player.team.color}
          />
        </div>
        <div className="card p-4 bg-paper">
          <div className="kicker mb-2">Points per event</div>
          <PointsByEventBar data={pointsByEvent} teamColor={player.team.color} />
        </div>
        {userData && (
          <>
            <div className="card p-4 bg-paper">
              <div className="kicker mb-2">Pick accuracy</div>
              <PickAccuracyDonut correct={pickCorrect} wrong={pickWrong} />
            </div>
            <div className="card p-4 bg-paper">
              <div className="kicker mb-2">Comment activity</div>
              <div className="flex items-baseline gap-3 mt-2">
                <div className="stat-num text-4xl text-ink">
                  {userData._count.comments}
                </div>
                <div className="kicker">TOTAL COMMENTS</div>
              </div>
              <div className="mt-4 space-y-1 max-h-32 overflow-y-auto">
                {userData.comments.slice(0, 5).map((c) => (
                  <div key={c.id} className="text-xs text-ink-soft truncate">
                    <span className="kicker mr-1">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    {c.event ? (
                      <Link
                        href={`/events/${c.event.id}`}
                        className="hover:text-ink"
                      >
                        [{c.event.name}]
                      </Link>
                    ) : (
                      <span>[lounge]</span>
                    )}{" "}
                    <span className="text-ink">{c.body}</span>
                  </div>
                ))}
                {userData.comments.length === 0 && (
                  <div className="text-sm text-ink-soft">No comments yet.</div>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <section>
        <div className="section-kicker">// Matchups</div>
        <h2 className="text-lg font-bold text-ink tracking-tight mb-2">
          Match history
        </h2>
        {eventGroups.length === 0 ? (
          <div className="card p-4 bg-paper text-sm text-ink-soft">
            Not in any matchups yet.
          </div>
        ) : (
          <div className="space-y-4">
            {eventGroups.map((g) => (
              <div key={g.eventId}>
                <Link
                  href={`/events/${g.eventId}`}
                  className="font-semibold text-ink hover:underline underline-offset-2"
                >
                  {g.eventName}
                </Link>
                <div className="mt-2 space-y-2">
                  {g.matchups.map((mp) => {
                    const m = mp.matchup;
                    const onTeamA = mp.side === "A";
                    const myTeam = onTeamA ? m.teamA : m.teamB;
                    const oppTeam = onTeamA ? m.teamB : m.teamA;
                    const oppPlayers = m.participants
                      .filter((p) => p.side === (onTeamA ? "B" : "A"))
                      .map((p) => p.player);
                    const partners = m.participants
                      .filter(
                        (p) => p.side === mp.side && p.playerId !== player.id
                      )
                      .map((p) => p.player);
                    const myScore = onTeamA ? m.scoreA : m.scoreB;
                    const oppScore = onTeamA ? m.scoreB : m.scoreA;
                    const settled = m.winnerTeamId != null;
                    const won = settled && m.winnerTeamId === player.teamId;
                    const lost = settled && m.winnerTeamId !== player.teamId;
                    return (
                      <div
                        key={mp.id}
                        className={`card p-3 bg-paper flex items-center justify-between gap-3 ${
                          lost ? "opacity-60" : ""
                        }`}
                      >
                        <div className="text-sm min-w-0">
                          {m.label && (
                            <div className="kicker mb-0.5">{m.label}</div>
                          )}
                          <div className="text-ink">
                            with{" "}
                            {partners.length === 0
                              ? "solo"
                              : partners.map((p) => p.name).join(" & ")}{" "}
                            vs{" "}
                            {oppPlayers.length === 0
                              ? "—"
                              : oppPlayers.map((p, i) => (
                                  <span key={p.id}>
                                    {i > 0 && " & "}
                                    <Link
                                      href={`/players/${p.id}`}
                                      className="hover:underline"
                                    >
                                      {p.name}
                                    </Link>
                                  </span>
                                ))}
                          </div>
                          <div className="kicker mt-0.5">
                            <span style={{ color: myTeam.color }}>
                              {myTeam.name}
                            </span>{" "}
                            vs{" "}
                            <span style={{ color: oppTeam.color }}>
                              {oppTeam.name}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="stat-num text-xl text-ink">
                            {myScore ?? "–"} : {oppScore ?? "–"}
                          </div>
                          {settled && (
                            <span
                              className={`badge mt-1 ${
                                won
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-red-100 text-red-800 border-red-300"
                              }`}
                            >
                              {won
                                ? `+${m.event.pointsValue} won`
                                : `−${m.event.pointsValue} lost`}
                            </span>
                          )}
                          {!settled && (
                            <span className="badge bg-paper-dark text-ink-soft mt-1">
                              pending
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {userData && (
        <PicksHistorySection
          championPickTeam={userData.championPickTeam}
          eventPicks={userData.predictions}
          matchupPicks={userData.matchupPredictions}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="card p-3 bg-paper">
      <div className="kicker">{label}</div>
      <div
        className="stat-num text-3xl mt-1"
        style={{ color: valueColor ?? "#0f0f0f" }}
      >
        {value}
      </div>
      {sub && <div className="kicker mt-0.5">{sub}</div>}
    </div>
  );
}

type TeamLite = { id: string; name: string; color: string; emoji: string | null };

function PicksHistorySection({
  championPickTeam,
  eventPicks,
  matchupPicks,
}: {
  championPickTeam: TeamLite | null;
  eventPicks: {
    id: string;
    pickedTeam: TeamLite | null;
    event: {
      id: string;
      name: string;
      status: string;
      winnerTeamId: string | null;
      winnerTeam: TeamLite | null;
    };
  }[];
  matchupPicks: {
    id: string;
    pickedTeam: TeamLite;
    matchup: {
      id: string;
      winnerTeamId: string | null;
      winnerTeam: TeamLite | null;
      event: { id: string; name: string };
    };
  }[];
}) {
  const settledCount =
    eventPicks.filter(
      (p) => p.event.status === "COMPLETED" && p.event.winnerTeamId
    ).length + matchupPicks.filter((m) => m.matchup.winnerTeamId).length;

  return (
    <section>
      <div className="section-kicker">// Picks</div>
      <h2 className="text-lg font-bold text-ink tracking-tight mb-2">
        Recent picks
      </h2>
      <div className="card p-4 bg-paper space-y-4">
        <div>
          <div className="kicker mb-1">Champion pick</div>
          {championPickTeam ? (
            <PickLine
              label="Overall champion"
              pickedTeam={championPickTeam}
              winnerTeam={null}
              settled={false}
            />
          ) : (
            <div className="text-sm text-ink-soft">None.</div>
          )}
        </div>
        {eventPicks.length === 0 && matchupPicks.length === 0 ? (
          <div className="text-sm text-ink-soft">
            No event or matchup picks yet.
          </div>
        ) : (
          <>
            {eventPicks
              .filter((p) => p.pickedTeam)
              .slice(0, 10)
              .map((p) => (
                <PickLine
                  key={p.id}
                  label={`Event: ${p.event.name}`}
                  pickedTeam={p.pickedTeam!}
                  winnerTeam={p.event.winnerTeam}
                  settled={
                    p.event.status === "COMPLETED" && p.event.winnerTeamId != null
                  }
                />
              ))}
            {matchupPicks.slice(0, 10).map((mp) => (
              <PickLine
                key={mp.id}
                label={`Matchup in ${mp.matchup.event.name}`}
                pickedTeam={mp.pickedTeam}
                winnerTeam={mp.matchup.winnerTeam}
                settled={mp.matchup.winnerTeamId != null}
              />
            ))}
            {settledCount === 0 && (
              <div className="kicker">
                None settled yet — accuracy will appear after events finish.
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function PickLine({
  label,
  pickedTeam,
  winnerTeam,
  settled,
}: {
  label: string;
  pickedTeam: TeamLite;
  winnerTeam: TeamLite | null;
  settled: boolean;
}) {
  const correct = settled && winnerTeam && pickedTeam.id === winnerTeam.id;
  const wrong = settled && winnerTeam && pickedTeam.id !== winnerTeam.id;
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-ink/10 px-3 py-2 text-sm">
      <span className="kicker truncate">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: pickedTeam.color }}
          aria-hidden
        />
        <span
          className={`font-semibold ${
            wrong ? "text-ink-soft line-through decoration-ink/30" : "text-ink"
          }`}
        >
          {pickedTeam.name}
        </span>
        {correct && (
          <span className="badge bg-emerald-100 text-emerald-800 border-emerald-300">
            ✓
          </span>
        )}
        {wrong && (
          <span className="badge bg-red-100 text-red-800 border-red-300">
            ✗ {winnerTeam?.name}
          </span>
        )}
        {!settled && <span className="kicker">pending</span>}
      </div>
    </div>
  );
}
