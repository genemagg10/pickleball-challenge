import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const schema = z.object({ teamId: z.string().min(1) });

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  const matchup = await prisma.matchup.findUnique({
    where: { id: params.id },
    include: { event: { select: { status: true } } },
  });
  if (!matchup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (matchup.winnerTeamId || matchup.event.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Picks are locked for this matchup" },
      { status: 409 }
    );
  }

  const { teamId } = parsed.data;
  if (teamId !== matchup.teamAId && teamId !== matchup.teamBId) {
    return NextResponse.json(
      { error: "Team is not in this matchup" },
      { status: 400 }
    );
  }

  await prisma.matchupPrediction.upsert({
    where: { userId_matchupId: { userId: user.id, matchupId: matchup.id } },
    update: { pickedTeamId: teamId },
    create: { userId: user.id, matchupId: matchup.id, pickedTeamId: teamId },
  });

  return NextResponse.json({ ok: true });
}
