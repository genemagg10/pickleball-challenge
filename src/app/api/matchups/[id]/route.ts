import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const patchSchema = z.object({
  label: z.string().max(60).optional(),
  scoreA: z.number().int().nullable().optional(),
  scoreB: z.number().int().nullable().optional(),
  winnerTeamId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const m = await prisma.matchup.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(m);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.matchup.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
