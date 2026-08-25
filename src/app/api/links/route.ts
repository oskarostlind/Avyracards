import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileMode } from "@prisma/client"; // VIKTIGT: Importerar Enumen
import { getT } from "@/i18n/server";
import { sanitizeLinkCustomization } from "@/lib/feature-access";
import { normalizeLinkUrl } from "@/utils/normalize-url";

export const runtime = "nodejs";

/**
 * GET /api/links?mode=SOCIAL|BUSINESS
 */
export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: getT()("api.notLoggedIn") },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const modeParam = searchParams.get("mode");

  // Översätt sträng till Prisma Enum. Fallback till SOCIAL.
  const mode: ProfileMode =
    modeParam === "BUSINESS" ? ProfileMode.BUSINESS : ProfileMode.SOCIAL;

  const links = await prisma.link.findMany({
    where: {
      userId: session.user.id,
      mode: mode
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(
    links.map((link) => ({
      id: link.id,
      label: link.title,
      url: link.url,
      isVisible: link.isActive,
      mode: link.mode,
      icon: link.icon,
      customColor: link.customColor,
    }))
  );
}

/**
 * POST /api/links
 */
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: getT()("api.notLoggedIn") },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[links] Ogiltig JSON:", err);
    return NextResponse.json(
      { error: getT()("api.invalidJson") },
      { status: 400 }
    );
  }

  const rawLabel = body.label ?? body.title;
  const rawUrl = body.url;

  // Översätt inkommande mode till Prisma Enum
  const mode: ProfileMode =
    body.mode === "BUSINESS" ? ProfileMode.BUSINESS : ProfileMode.SOCIAL;

  const label = typeof rawLabel === "string" ? rawLabel.trim() : "";

  if (!label || typeof rawUrl !== "string" || !rawUrl.trim()) {
    return NextResponse.json(
      { error: getT()("api.links.titleAndUrlRequired") },
      { status: 400 }
    );
  }

  // "oskarostlind.se" -> "https://oskarostlind.se". Samma util som formuläret
  // kör, så klienten och servern kan aldrig gissa olika.
  const normalized = normalizeLinkUrl(rawUrl);
  if (!normalized.ok) {
    return NextResponse.json(
      { error: getT()("api.links.invalidUrl") },
      { status: 400 }
    );
  }
  const url = normalized.url;

  // Premium-gating görs här, inte bara i UI: ett direktanrop mot API:t ska
  // inte kunna sätta customColor på ett gratiskonto. (Se src/lib/feature-access.ts)
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, role: true },
  });

  const customization = sanitizeLinkCustomization(
    { icon: body.icon ?? null, customColor: body.customColor ?? null },
    { isPremium: account?.isPremium, isAdmin: account?.role === "ADMIN" },
  );

  try {
    const count = await prisma.link.count({
      where: {
        userId: session.user.id,
        mode: mode
      },
    });

    const created = await prisma.link.create({
      data: {
        userId: session.user.id,
        title: label,
        url,
        order: count,
        isActive: true,
        mode: mode, // Nu vet TypeScript att detta fält finns
        icon: customization.icon ?? null,
        customColor: customization.customColor ?? null,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        label,
        url,
        isVisible: created.isActive,
        mode: created.mode,
        icon: created.icon,
        customColor: created.customColor,
        sanitized: customization.sanitized,
        removed: customization.removed,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[links] Fel vid skapande:", err);
    return NextResponse.json(
      { error: getT()("api.links.createFailed") },
      { status: 500 }
    );
  }
}
