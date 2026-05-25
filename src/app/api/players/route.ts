import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(60),
  teamId: z.string().min(1),
  userId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  try {
    const player = await prisma.player.create({
      data: {
        name: parsed.data.name.trim(),
        teamId: parsed.data.teamId,
        userId: parsed.data.userId ?? null,
      },
    });
    return NextResponse.json(player);
  } catch {
    return NextResponse.json(
      { error: "Could not create player (user may already be linked elsewhere)" },
      { status: 409 }
    );
  }
}
