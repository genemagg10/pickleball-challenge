import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(120).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  pointsValue: z.number().int().min(1).max(10000).optional(),
  status: z.enum(["UPCOMING", "IN_PROGRESS", "COMPLETED"]).optional(),
  winnerTeamId: z.string().nullable().optional(),
  scoreA: z.number().int().nullable().optional(),
  scoreB: z.number().int().nullable().optional(),
  resultNotes: z.string().nullable().optional(),
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

  const data: Record<string, unknown> = { ...parsed.data };
  if (typeof parsed.data.startsAt !== "undefined") {
    data.startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : null;
  }
  const event = await prisma.event.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(event);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.event.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
