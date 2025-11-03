import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "../auth/[...nextauth]/auth";

const createLinkSchema = z.object({
  label: z.string().min(1).max(60),
  url: z.string().url(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 401 });
  }

  const links = await prisma.link.findMany({
    where: { userId: session.user.id },
    orderBy: { position: "asc" },
  });

  return NextResponse.json({ links });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createLinkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltig länk" }, { status: 400 });
  }

  const maxPosition = await prisma.link.aggregate({
    where: { userId: session.user.id },
    _max: { position: true },
  });

  const link = await prisma.link.create({
    data: {
      userId: session.user.id,
      label: parsed.data.label,
      url: parsed.data.url,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  return NextResponse.json({ link }, { status: 201 });
}
