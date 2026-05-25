import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex like #1d4ed8"),
  emoji: z.string().max(8).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  try {
    const team = await prisma.team.create({
      data: {
        name: parsed.data.name.trim(),
        color: parsed.data.color,
        emoji: parsed.data.emoji ?? null,
      },
    });
    return NextResponse.json(team);
  } catch {
    return NextResponse.json({ error: "Team name already exists" }, { status: 409 });
  }
}
