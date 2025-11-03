import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "../auth/[...nextauth]/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      bio: true,
      themeColor: true,
      fontFamily: true,
      template: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Användare saknas" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
