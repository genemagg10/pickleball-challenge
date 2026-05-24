import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  eventId: z.string().nullable().optional(),
  body: z.string().min(1).max(2000),
});

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
  if (parsed.data.eventId) {
    const ev = await prisma.event.findUnique({
      where: { id: parsed.data.eventId },
      select: { id: true },
    });
    if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  const created = await prisma.comment.create({
    data: {
      userId: user.id,
      eventId: parsed.data.eventId ?? null,
      body: parsed.data.body.trim(),
    },
  });
  return NextResponse.json({ id: created.id });
}
