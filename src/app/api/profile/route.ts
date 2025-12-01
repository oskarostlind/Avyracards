import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Tillåter en riktig bild-URL ELLER data-URL, men vi hanterar null separat
const avatarSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value.startsWith("data:image/") ||
      value.startsWith("http://") ||
      value.startsWith("https://"),
    {
      message: "avatarUrl måste vara en giltig URL eller data-URL.",
    }
  );

const updateSchema = z.object({
  name: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  username: z.string().min(3).max(50).optional(),

  // 👇 Viktigt: vi tillåter null
  phoneNumber: z.string().max(30).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),

  // 👇 avatarUrl kan vara sträng eller null
  avatarUrl: avatarSchema.or(z.literal(null)).optional(),

  redirectEnabled: z.boolean().optional(),

  // 👇 lägg tillbaka theme/font så de kan sparas
  theme: z.string().max(50).optional(),
  font: z.string().max(50).optional(),

  // 👇 profileMode matchar din Prisma-enum (VERSALER)
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
    // console.log(parsed.error.format()); // bra att ha om du vill debugga mer
    return NextResponse.json({ error: "Ogiltiga fält." }, { status: 400 });
  }

  const data = parsed.data;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      bio: data.bio,
      username: data.username,
      phoneNumber: data.phoneNumber ?? null,
      contactEmail: data.contactEmail ?? null,
      avatarUrl: data.avatarUrl ?? null,
      redirectEnabled: data.redirectEnabled,

      theme: data.theme,
      font: data.font,

      profileMode: data.profileMode,
    },
    select: {
      id: true,
      name: true,
      bio: true,
      username: true,
      phoneNumber: true,
      contactEmail: true,
      avatarUrl: true,
      redirectEnabled: true,
      theme: true,
      font: true,
      profileMode: true,
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
      theme: true,
      font: true,
      profileMode: true,
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
