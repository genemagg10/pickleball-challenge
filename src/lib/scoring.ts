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
  const completedEvents = await prisma.event.findMany({
    where: { status: "COMPLETED", winnerTeamId: { not: null } },
    select: { id: true, winnerTeamId: true },
  });
  if (completedEvents.length === 0) return [];

  const eventIds = completedEvents.map((e) => e.id);
  const winnerByEvent = new Map(completedEvents.map((e) => [e.id, e.winnerTeamId!]));

  const predictions = await prisma.prediction.findMany({
    where: { eventId: { in: eventIds } },
    include: { user: { select: { id: true, name: true } } },
  });

  const byUser = new Map<string, PredictionLeader>();
  for (const p of predictions) {
    if (!p.eventId || !p.pickedTeamId) continue;
    const winner = winnerByEvent.get(p.eventId);
    if (!winner) continue;
    const entry =
      byUser.get(p.userId) ??
      { userId: p.userId, name: p.user.name, correct: 0, total: 0, accuracy: 0 };
    entry.total += 1;
    if (p.pickedTeamId === winner) entry.correct += 1;
    byUser.set(p.userId, entry);
  }

  const list = Array.from(byUser.values()).map((u) => ({
    ...u,
    accuracy: u.total === 0 ? 0 : u.correct / u.total,
  }));
  list.sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct);
  return list;
}
