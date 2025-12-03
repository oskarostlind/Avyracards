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
  // Basprofil
  name: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  username: z.string().min(3).max(50).optional(),

  // 👇 Viktigt: vi tillåter null
  phoneNumber: z.string().max(30).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),

  // 👇 avatarUrl kan vara sträng eller null
  avatarUrl: avatarSchema.or(z.literal(null)).optional(),

  redirectEnabled: z.boolean().optional(),

  // Tema / font
  theme: z.string().max(50).optional(),
  font: z.string().max(50).optional(),

  // Profil-läge
  profileMode: z.enum(["SOCIAL", "BUSINESS"]).optional(),

  // --- Business-specifika fält ---

  // Hero
  jobTitle: z.string().max(120).nullable().optional(),
  companyName: z.string().max(160).nullable().optional(),
  location: z.string().max(160).nullable().optional(),
  businessHeadline: z.string().max(200).nullable().optional(),

  // Kontaktblock
  businessPhone: z.string().max(50).nullable().optional(),
  businessEmail: z.string().email().nullable().optional(),
  vcardUrl: z.string().url().max(500).nullable().optional(),
  bookingUrl: z.string().url().max(500).nullable().optional(),

  // Nyckelinfo / chips
  expertiseTags: z.string().max(500).nullable().optional(),
  languages: z.string().max(200).nullable().optional(),
  businessRegion: z.string().max(160).nullable().optional(),

  // Företagssektion
  companyLogoUrl: z.string().url().max(500).nullable().optional(),
  companyDescription: z.string().max(1000).nullable().optional(),
  companyWebsite: z.string().url().max(500).nullable().optional(),
  careerPageUrl: z.string().url().max(500).nullable().optional(),
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
      // Basprofil
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

      // Business-fält
      jobTitle: data.jobTitle ?? null,
      companyName: data.companyName ?? null,
      location: data.location ?? null,
      businessHeadline: data.businessHeadline ?? null,

      businessPhone: data.businessPhone ?? null,
      businessEmail: data.businessEmail ?? null,
      vcardUrl: data.vcardUrl ?? null,
      bookingUrl: data.bookingUrl ?? null,

      expertiseTags: data.expertiseTags ?? null,
      languages: data.languages ?? null,
      businessRegion: data.businessRegion ?? null,

      companyLogoUrl: data.companyLogoUrl ?? null,
      companyDescription: data.companyDescription ?? null,
      companyWebsite: data.companyWebsite ?? null,
      careerPageUrl: data.careerPageUrl ?? null,
    },
    select: {
      id: true,
      email: true,
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

      jobTitle: true,
      companyName: true,
      location: true,
      businessHeadline: true,

      businessPhone: true,
      businessEmail: true,
      vcardUrl: true,
      bookingUrl: true,

      expertiseTags: true,
      languages: true,
      businessRegion: true,

      companyLogoUrl: true,
      companyDescription: true,
      companyWebsite: true,
      careerPageUrl: true,
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
      email: true,
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

      jobTitle: true,
      companyName: true,
      location: true,
      businessHeadline: true,

      businessPhone: true,
      businessEmail: true,
      vcardUrl: true,
      bookingUrl: true,

      expertiseTags: true,
      languages: true,
      businessRegion: true,

      companyLogoUrl: true,
      companyDescription: true,
      companyWebsite: true,
      careerPageUrl: true,
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
