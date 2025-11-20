import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { username: string } }
) {
  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: {
      username: true,
      bio: true,
      theme: true,
      font: true,
      avatarUrl: true,
      backgroundUrl: true,
      links: {
        where: { isActive: true },
        orderBy: { order: "asc" }
      }
    }
  });

  if (!user) {
    return NextResponse.json({ error: "Profil saknas" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
