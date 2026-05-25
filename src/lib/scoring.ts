import { prisma } from "@/lib/db";

export type TeamStanding = {
  teamId: string;
  name: string;
  color: string;
  emoji: string | null;
  points: number;
  matchupsWon: number;
};

export async function getStandings(): Promise<TeamStanding[]> {
  const [teams, settledMatchups] = await Promise.all([
    prisma.team.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.matchup.findMany({
      where: { winnerTeamId: { not: null } },
      select: {
        winnerTeamId: true,
        event: { select: { pointsValue: true } },
      },
    }),
  ]);

  return teams.map((t) => {
    const wins = settledMatchups.filter((m) => m.winnerTeamId === t.id);
    return {
      teamId: t.id,
      name: t.name,
      color: t.color,
      emoji: t.emoji,
      points: wins.reduce((s, m) => s + m.event.pointsValue, 0),
      matchupsWon: wins.length,
    };
  });
}

export type EventScore = {
  teamAPoints: number;
  teamBPoints: number;
  teamAMatchupsWon: number;
  teamBMatchupsWon: number;
};

export function getEventScore(
  matchups: { winnerTeamId: string | null }[],
  pointsValue: number,
  teamAId: string,
  teamBId: string
): EventScore {
  let aWins = 0;
  let bWins = 0;
  for (const m of matchups) {
    if (m.winnerTeamId === teamAId) aWins += 1;
    else if (m.winnerTeamId === teamBId) bWins += 1;
  }
  return {
    teamAPoints: aWins * pointsValue,
    teamBPoints: bWins * pointsValue,
    teamAMatchupsWon: aWins,
    teamBMatchupsWon: bWins,
  };
}

export type PredictionLeader = {
  userId: string;
  name: string;
  correct: number;
  total: number;
  accuracy: number;
};

export async function getPredictionLeaderboard(): Promise<PredictionLeader[]> {
  const [settledMatchups, matchupPredictions] = await Promise.all([
    prisma.matchup.findMany({
      where: { winnerTeamId: { not: null } },
      select: { id: true, winnerTeamId: true },
    }),
    prisma.matchupPrediction.findMany({
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

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
