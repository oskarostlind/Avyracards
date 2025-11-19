import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i),
  name: z.string().optional()
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltiga fält." }, { status: 400 });
  }

  const { email, password, username, name } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    }
  });

  if (existing) {
    return NextResponse.json(
      { error: "E-post eller användarnamn används redan." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      username: username.toLowerCase(),
      name: name || username
    }
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
