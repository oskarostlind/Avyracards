import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

const schema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i),
  password: z.string().min(6),
  email: z.string().email().optional(),
  name: z.string().optional()
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ogiltiga uppgifter. Kontrollera användarnamn och lösenord." },
      { status: 400 }
    );
  }

  const { username, password, email, name } = parsed.data;

  const normalizedUsername = username.toLowerCase();

  const existingByUsername = await prisma.user.findUnique({
    where: { username: normalizedUsername }
  });

  if (existingByUsername) {
    return NextResponse.json(
      { error: "Användarnamnet är redan upptaget." },
      { status: 400 }
    );
  }

  const emailToUse = email ?? `${normalizedUsername}@placeholder.local`;

  const existingByEmail = await prisma.user.findUnique({
    where: { email: emailToUse }
  });

  if (existingByEmail) {
    return NextResponse.json(
      { error: "Kunde inte skapa konto. Försök med ett annat användarnamn." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      email: emailToUse,
      passwordHash,
      username: normalizedUsername,
      name: name || username
    }
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
