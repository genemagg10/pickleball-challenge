import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  teamId: z.string().nullable(),
  playerId: z.string().nullable(),
});

export async function PATCH(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { teamId, playerId } = parsed.data;

  if (playerId && !teamId) {
    return NextResponse.json(
      { error: "Pick a team before picking a player" },
      { status: 400 }
    );
  }
  if (teamId) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return NextResponse.json({ error: "Unknown team" }, { status: 400 });
  }
  if (playerId) {
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return NextResponse.json({ error: "Unknown player" }, { status: 400 });
    if (player.teamId !== teamId) {
      return NextResponse.json(
        { error: "Player isn't on the team you picked" },
        { status: 400 }
      );
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { rootingForTeamId: teamId, rootingForPlayerId: playerId },
  });
  return NextResponse.json({ ok: true });
}
