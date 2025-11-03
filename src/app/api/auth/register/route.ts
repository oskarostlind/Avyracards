import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(128),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username.toLowerCase() },
  });

  if (existing) {
    return NextResponse.json({ error: "Användarnamnet är upptaget" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const created = await prisma.user.create({
    data: {
      username: parsed.data.username.toLowerCase(),
      passwordHash,
      themeColor: "default",
      fontFamily: "inter",
      template: "default",
      bio: "",
    },
    select: { id: true, username: true },
  });

  return NextResponse.json({ user: created }, { status: 201 });
}
