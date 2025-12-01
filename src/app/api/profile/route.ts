import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const avatarSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value.startsWith("data:image/") ||
      value.startsWith("http://") ||
      value.startsWith("https://"),
    {
      message: "Ogiltig bild-URL eller data-URL.",
    }
  );

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(1000).optional(),
  username: z.string().min(3).max(50).optional(),
  phoneNumber: z.string().max(50).optional(),
  contactEmail: z.string().email().optional(),
  avatarUrl: avatarSchema.optional(),
  redirectEnabled: z.boolean().optional(),
  // 👇 Viktigt: matchar din Prisma-enum med VERSALER
  profileMode: z.enum(["SOCIAL", "BUSINESS"]).optional(),
});

async function updateProfile(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du måste vara inloggad för att uppdatera profilen." },
      { status: 401 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Ogiltig JSON i förfrågan." },
      { status: 400 }
    );
  }

  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ogiltiga fält." },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      bio: true,
      username: true,
      phoneNumber: true,
      contactEmail: true,
      avatarUrl: true,
      redirectEnabled: true,
      profileMode: true, // 👈 NYTT
    },
  });

  return NextResponse.json(updated);
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du måste vara inloggad." },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      bio: true,
      username: true,
      phoneNumber: true,
      contactEmail: true,
      avatarUrl: true,
      redirectEnabled: true,
      profileMode: true, // 👈 NYTT
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Användare hittades inte." },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  return updateProfile(req);
}

export async function POST(req: Request) {
  return updateProfile(req);
}
