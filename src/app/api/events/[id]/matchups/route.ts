import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  label: z.string().max(60).optional().default(""),
  teamAId: z.string().min(1),
  teamBId: z.string().min(1),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (parsed.data.teamAId === parsed.data.teamBId) {
    return NextResponse.json({ error: "Teams must differ" }, { status: 400 });
  }
  const last = await prisma.matchup.findFirst({
    where: { eventId: params.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const matchup = await prisma.matchup.create({
    data: {
      eventId: params.id,
      label: parsed.data.label,
      teamAId: parsed.data.teamAId,
      teamBId: parsed.data.teamBId,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json({ id: matchup.id });
}
