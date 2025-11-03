import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "../../auth/[...nextauth]/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Ingen fil" }, { status: 400 });
  }

  const blob = await put(`profiles/${session.user.id}-${Date.now()}.png`, file, {
    access: "public",
  });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { profileImage: blob.url },
    select: {
      id: true,
      profileImage: true,
    },
  });

  return NextResponse.json({ user, blob });
}
