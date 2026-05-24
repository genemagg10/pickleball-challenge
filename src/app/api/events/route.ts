import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().default(""),
  location: z.string().max(120).optional().default(""),
  startsAt: z.string().datetime().nullable().optional(),
  pointsValue: z.number().int().min(1).max(10000).optional().default(1),
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
  const last = await prisma.event.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const event = await prisma.event.create({
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description ?? "",
      location: parsed.data.location ?? "",
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      pointsValue: parsed.data.pointsValue ?? 1,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json({ id: event.id });
}
