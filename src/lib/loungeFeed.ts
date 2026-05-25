import { prisma } from "@/lib/db";
import type { FeedItem } from "@/components/CommentThread";

export async function getLoungeFeed({ take }: { take: number }): Promise<FeedItem[]> {
  const [comments, completedEvents, completedMatchups] = await Promise.all([
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            rootingForTeam: true,
            rootingForPlayer: { select: { id: true, name: true, teamId: true } },
            player: { select: { id: true, name: true, isCaptain: true } },
          },
        },
        event: { select: { id: true, name: true } },
      },
      take: Math.max(take * 2, 50),
    }),
    prisma.event.findMany({
      where: { status: "COMPLETED", winnerTeamId: { not: null } },
      include: { winnerTeam: true },
      orderBy: { updatedAt: "desc" },
      take,
    }),
    prisma.matchup.findMany({
      where: { winnerTeamId: { not: null } },
      include: {
        winnerTeam: true,
        event: { select: { id: true, name: true } },
        participants: {
          include: { player: { select: { id: true, name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take,
    }),
  ]);

  const items: FeedItem[] = [];

  for (const c of comments) {
    items.push({
      type: "comment",
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      user: c.user,
      event: c.event,
    });
  }

  for (const e of completedEvents) {
    if (!e.winnerTeam) continue;
    items.push({
      type: "event_completed",
      id: `event-${e.id}`,
      createdAt: e.updatedAt,
      event: { id: e.id, name: e.name },
      winnerTeam: e.winnerTeam,
      scoreA: e.scoreA,
      scoreB: e.scoreB,
    });
  }

  for (const m of completedMatchups) {
    if (!m.winnerTeam) continue;
    items.push({
      type: "matchup_completed",
      id: `matchup-${m.id}`,
      createdAt: m.updatedAt,
      event: m.event,
      label: m.label,
      winnerTeam: m.winnerTeam,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      sideAPlayers: m.participants
        .filter((p) => p.side === "A")
        .map((p) => p.player),
      sideBPlayers: m.participants
        .filter((p) => p.side === "B")
        .map((p) => p.player),
    });
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return items.slice(0, take);
}
