import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileMode } from "@prisma/client"; // VIKTIGT: Importerar Enumen

export const runtime = "nodejs";

/**
 * GET /api/links?mode=SOCIAL|BUSINESS
 */
export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du måste vara inloggad." },
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
      { error: "Du måste vara inloggad." },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[links] Ogiltig JSON:", err);
    return NextResponse.json(
      { error: "Ogiltig JSON i förfrågan." },
      { status: 400 }
    );
  }

  const rawLabel = body.label ?? body.title;
  const rawUrl = body.url;
  
  // Översätt inkommande mode till Prisma Enum
  const mode: ProfileMode = 
    body.mode === "BUSINESS" ? ProfileMode.BUSINESS : ProfileMode.SOCIAL;

  const label = typeof rawLabel === "string" ? rawLabel.trim() : "";
  const url = typeof rawUrl === "string" ? rawUrl.trim() : "";

  if (!label || !url) {
    return NextResponse.json(
      { error: "Titel och URL krävs." },
      { status: 400 }
    );
  }

  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: "URL måste börja med http:// eller https://." },
      { status: 400 }
    );
  }

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
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        label,
        url,
        isVisible: created.isActive,
        mode: created.mode,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[links] Fel vid skapande:", err);
    return NextResponse.json(
      { error: "Kunde inte skapa länk." },
      { status: 500 }
    );
  }
}