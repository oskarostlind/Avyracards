import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { username: string } }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: {
      username: true,
      bio: true,
      themeColor: true,
      fontFamily: true,
      template: true,
      profileImage: true,
      links: {
        where: { isVisible: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Profil saknas" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
