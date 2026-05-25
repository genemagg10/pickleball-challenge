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

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Picks are locked for completed events" },
      { status: 409 }
    );
  }
  const team = await prisma.team.findUnique({ where: { id: parsed.data.teamId } });
  if (!team) return NextResponse.json({ error: "Unknown team" }, { status: 400 });

  await prisma.prediction.upsert({
    where: { userId_eventId: { userId: user.id, eventId: event.id } },
    update: { pickedTeamId: team.id },
    create: { userId: user.id, eventId: event.id, pickedTeamId: team.id },
  });

  return NextResponse.json({ ok: true });
}
