import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/links
 * Hämtar alla länkar för inloggad användare.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du måste vara inloggad." },
      { status: 401 }
    );
  }

  const links = await prisma.link.findMany({
    where: { userId: session.user.id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(
    links.map((link) => ({
      id: link.id,
      label: link.title,
      url: link.url,
      isVisible: link.isActive,
    }))
  );
}

/**
 * POST /api/links
 * Skapar en ny länk för inloggad användare.
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

  console.log("[links] Inkommande body:", body);

  // Stöd både { label } och { title } från klienten
  const rawLabel = body.label ?? body.title;
  const rawUrl = body.url;

  const label = typeof rawLabel === "string" ? rawLabel.trim() : "";
  const url = typeof rawUrl === "string" ? rawUrl.trim() : "";

  if (!label) {
    return NextResponse.json(
      { error: "Länktitel saknas eller är tom." },
      { status: 400 }
    );
  }

  if (!url) {
    return NextResponse.json(
      { error: "URL saknas eller är tom." },
      { status: 400 }
    );
  }

  // Superenkel URL-koll – vi struntar i strikt zod-url här
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: "URL måste börja med http:// eller https://." },
      { status: 400 }
    );
  }

  try {
    const count = await prisma.link.count({
      where: { userId: session.user.id },
    });

    const created = await prisma.link.create({
      data: {
        userId: session.user.id,
        title: label,
        url,
        order: count,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        label,
        url,
        isVisible: created.isActive,
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
