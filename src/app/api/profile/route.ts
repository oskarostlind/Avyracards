import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncGoogleWalletPass } from "@/lib/wallet/google";
import { WALLET_PASS_FIELDS } from "@/lib/wallet/pass-content";

export const runtime = "nodejs";

/** Sant om sparningen rör något som syns på ett wallet-pass. */
function touchesWalletPass(data: Record<string, unknown>): boolean {
  return WALLET_PASS_FIELDS.some((field) => data[field] !== undefined);
}

// --- HJÄLPSCHEMAN ---

// 1. Hanterar Avatar (URL, Base64 eller null)
const avatarSchema = z.union([
  z.string().min(1).refine(
    (value) =>
      value.startsWith("data:image/") ||
      value.startsWith("http://") ||
      value.startsWith("https://"),
    { message: "Måste vara giltig URL eller bild-data." }
  ),
  z.literal(""),
  z.null()
]).optional().transform(v => v === "" ? null : v);

// 2. Hanterar valfria textfält (Tom sträng -> Null)
const optionalString = (maxLength: number) => 
  z.union([
    z.string().min(1).max(maxLength), // En riktig sträng
    z.literal(""),                    // En tom sträng
    z.null()                          // Null
  ]).optional().transform(v => v === "" ? null : v);

// 3. Hanterar valfria URL:er (Tom sträng -> Null)
const optionalUrl = (maxLength: number) => 
  z.union([
    z.string().url().max(maxLength), 
    z.literal(""),
    z.null()
  ]).optional().transform(v => v === "" ? null : v);

// 4. Hanterar valfri Email (Tom sträng -> Null)
const optionalEmail = z.union([
  z.string().email(),
  z.literal(""),
  z.null()
]).optional().transform(v => v === "" ? null : v);


// --- HUVUDSCHEMA ---
const updateSchema = z.object({
  // Basprofil
  name: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  username: z.string().min(3).max(50).optional(),

  phoneNumber: optionalString(30),
  contactEmail: optionalEmail,
  avatarUrl: avatarSchema,

  // Redirect-inställningar
  redirectEnabled: z.boolean().optional(),
  redirectLinkId: z.string().nullable().optional(), 

  theme: z.string().max(50).optional(),
  font: z.string().max(50).optional(),
  profileMode: z.enum(["SOCIAL", "BUSINESS"]).optional(),

  // Business-specifika fält
  businessAvatarUrl: avatarSchema, // <--- NYTT: LÄGG TILL DETTA
  jobTitle: optionalString(120),
  companyName: optionalString(160),
  location: optionalString(160),
  businessHeadline: optionalString(200),

  businessPhone: optionalString(50),
  businessEmail: optionalEmail,
  
  vcardUrl: optionalUrl(500),
  bookingUrl: optionalUrl(500),

  expertiseTags: optionalString(500),
  languages: optionalString(200),
  businessRegion: optionalString(160),

  companyLogoUrl: optionalUrl(500),
  companyDescription: optionalString(1000),
  companyWebsite: optionalUrl(500),
  careerPageUrl: optionalUrl(500),
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
    console.log("Validation error:", parsed.error.format()); 
    return NextResponse.json({ error: "Ogiltiga fält kontrollera formatet." }, { status: 400 });
  }

  const data = parsed.data;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      // Basprofil
      name: data.name,
      bio: data.bio,
      username: data.username,
      phoneNumber: data.phoneNumber,
      contactEmail: data.contactEmail,
      avatarUrl: data.avatarUrl,
      
      // Redirect
      redirectEnabled: data.redirectEnabled,
      redirectLinkId: data.redirectLinkId, 

      theme: data.theme,
      font: data.font,

      profileMode: data.profileMode,

      // Business-fält
      businessAvatarUrl: data.businessAvatarUrl, // <--- NYTT: UPPDATERA HÄR
      jobTitle: data.jobTitle,
      companyName: data.companyName,
      location: data.location,
      businessHeadline: data.businessHeadline,

      businessPhone: data.businessPhone,
      businessEmail: data.businessEmail,
      vcardUrl: data.vcardUrl,
      bookingUrl: data.bookingUrl,

      expertiseTags: data.expertiseTags,
      languages: data.languages,
      businessRegion: data.businessRegion,

      companyLogoUrl: data.companyLogoUrl,
      companyDescription: data.companyDescription,
      companyWebsite: data.companyWebsite,
      careerPageUrl: data.careerPageUrl,
    },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      businessAvatarUrl: true, // <--- NYTT: Returnera detta så frontend kan uppdateras
      profileMode: true,
      redirectEnabled: true,
      redirectLinkId: true,

      // Behövs för wallet-synken nedan.
      bio: true,
      businessHeadline: true,
      jobTitle: true,
    },
  });

  // Wallet lifecycle: ett pass som redan ligger i användarens telefon är
  // serverägt och uppdateras inte av sig självt. Utan det här visade passet
  // gammalt namn/titel/bild — och efter ett byte av användarnamn pekade
  // QR-koden på en profil som inte längre fanns.
  //
  // Synken hoppas över när inget passrelevant fält var med i sparningen, och
  // kastar aldrig: Google-strul får inte göra att profilen inte går att spara.
  if (touchesWalletPass(data)) {
    await syncGoogleWalletPass(updated);
  }

  return NextResponse.json(updated);
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Du måste vara inloggad." }, { status: 401 });
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
      redirectLinkId: true, 

      theme: true,
      font: true,
      profileMode: true,

      businessAvatarUrl: true, // <--- NYTT: HÄMTA DETTA VID GET
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
    return NextResponse.json({ error: "Användare hittades inte." }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  return updateProfile(req);
}

export async function POST(req: Request) {
  return updateProfile(req);
} 