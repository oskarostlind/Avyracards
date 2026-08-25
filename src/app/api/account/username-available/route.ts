import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Live-tillgänglighetskoll för användarnamn, t.ex. i onboardingens
// username-steg för nya Apple-konton. Samma regler som i apple-user.ts
// (slugifyUsername) och register/account-flödena: a-z, 0-9, _, 3-20 tecken.
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const username = (searchParams.get("username") ?? "").toLowerCase().trim();

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  // Användarens eget nuvarande namn räknas som tillgängligt för dem själva.
  if (username === session.user.username?.toLowerCase()) {
    return NextResponse.json({ available: true });
  }

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
