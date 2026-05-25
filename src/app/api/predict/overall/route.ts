import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const schema = z.object({ teamId: z.string().min(1) });

export async function POST(req: Request) {
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
  const team = await prisma.team.findUnique({ where: { id: parsed.data.teamId } });
  if (!team) return NextResponse.json({ error: "Unknown team" }, { status: 400 });
  await prisma.user.update({
    where: { id: user.id },
    data: { championPickTeamId: team.id },
  });
  return NextResponse.json({ ok: true });
}
