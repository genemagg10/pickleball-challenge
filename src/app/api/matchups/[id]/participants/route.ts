import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  side: z.enum(["A", "B"]),
  playerIds: z.array(z.string()).max(10),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const matchup = await prisma.matchup.findUnique({ where: { id: params.id } });
  if (!matchup) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const expectedTeamId = parsed.data.side === "A" ? matchup.teamAId : matchup.teamBId;

  // Validate players are on the expected team
  if (parsed.data.playerIds.length > 0) {
    const players = await prisma.player.findMany({
      where: { id: { in: parsed.data.playerIds } },
      select: { id: true, teamId: true },
    });
    if (players.length !== parsed.data.playerIds.length) {
      return NextResponse.json({ error: "Unknown player" }, { status: 400 });
    }
    const wrong = players.find((p) => p.teamId !== expectedTeamId);
    if (wrong) {
      return NextResponse.json(
        { error: "Player isn't on this side's team" },
        { status: 400 }
      );
    }
  }

  await prisma.$transaction([
    prisma.matchupParticipant.deleteMany({
      where: { matchupId: params.id, side: parsed.data.side },
    }),
    ...(parsed.data.playerIds.length
      ? [
          prisma.matchupParticipant.createMany({
            data: parsed.data.playerIds.map((playerId) => ({
              matchupId: params.id,
              playerId,
              side: parsed.data.side,
            })),
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
