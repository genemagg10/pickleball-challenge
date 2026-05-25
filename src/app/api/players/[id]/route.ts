import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const patchSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  teamId: z.string().min(1).optional(),
  userId: z.string().nullable().optional(),
  isCaptain: z.boolean().optional(),
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
  try {
    const player = await prisma.player.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(player);
  } catch {
    return NextResponse.json(
      { error: "Could not update player (user may already be linked elsewhere)" },
      { status: 409 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.player.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
