import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(60),
  password: z.string().min(6).max(200),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const userCount = await prisma.user.count();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const isAdmin = userCount === 0 || (adminEmail && adminEmail === email) ? true : false;

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: { email, name: parsed.data.name.trim(), passwordHash, isAdmin },
  });

  return NextResponse.json({ id: user.id, email: user.email, isAdmin: user.isAdmin });
}
