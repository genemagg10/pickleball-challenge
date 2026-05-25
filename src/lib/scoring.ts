import { prisma } from "@/lib/db";

export type TeamStanding = {
  teamId: string;
  name: string;
  color: string;
  emoji: string | null;
  points: number;
  eventsWon: number;
};

export async function getStandings(): Promise<TeamStanding[]> {
  const teams = await prisma.team.findMany({ orderBy: { createdAt: "asc" } });
  const completed = await prisma.event.findMany({
    where: { status: "COMPLETED", winnerTeamId: { not: null } },
    select: { winnerTeamId: true, pointsValue: true },
  });

  return teams.map((t) => {
    const wins = completed.filter((e) => e.winnerTeamId === t.id);
    return {
      teamId: t.id,
      name: t.name,
      color: t.color,
      emoji: t.emoji,
      points: wins.reduce((s, e) => s + e.pointsValue, 0),
      eventsWon: wins.length,
    };
  });
}

export type PredictionLeader = {
  userId: string;
  name: string;
  correct: number;
  total: number;
  accuracy: number;
};

export async function getPredictionLeaderboard(): Promise<PredictionLeader[]> {
  const [completedEvents, settledMatchups, eventPredictions, matchupPredictions] =
    await Promise.all([
      prisma.event.findMany({
        where: { status: "COMPLETED", winnerTeamId: { not: null } },
        select: { id: true, winnerTeamId: true },
      }),
      prisma.matchup.findMany({
        where: { winnerTeamId: { not: null } },
        select: { id: true, winnerTeamId: true },
      }),
      prisma.prediction.findMany({
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.matchupPrediction.findMany({
        include: { user: { select: { id: true, name: true } } },
      }),
    ]);

  const winnerByEvent = new Map(completedEvents.map((e) => [e.id, e.winnerTeamId!]));
  const winnerByMatchup = new Map(settledMatchups.map((m) => [m.id, m.winnerTeamId!]));

  const byUser = new Map<string, PredictionLeader>();
  const upsert = (userId: string, name: string) => {
    let entry = byUser.get(userId);
    if (!entry) {
      entry = { userId, name, correct: 0, total: 0, accuracy: 0 };
      byUser.set(userId, entry);
    }
    return entry;
  };

  for (const p of eventPredictions) {
    if (!p.pickedTeamId) continue;
    const winner = winnerByEvent.get(p.eventId);
    if (!winner) continue;
    const entry = upsert(p.userId, p.user.name);
    entry.total += 1;
    if (p.pickedTeamId === winner) entry.correct += 1;
  }

  for (const p of matchupPredictions) {
    const winner = winnerByMatchup.get(p.matchupId);
    if (!winner) continue;
    const entry = upsert(p.userId, p.user.name);
    entry.total += 1;
    if (p.pickedTeamId === winner) entry.correct += 1;
  }

  const list = Array.from(byUser.values()).map((u) => ({
    ...u,
    accuracy: u.total === 0 ? 0 : u.correct / u.total,
  }));
  list.sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct);
  return list;
}
