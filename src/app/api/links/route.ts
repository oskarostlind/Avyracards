import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const linkSchema = z.object({
  title: z.string().min(1).max(100),
  url: z.string().url(),
  icon: z.string().max(50).optional()
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await prisma.link.findMany({
    where: { userId: session.user.id },
    orderBy: { order: "asc" }
  });

  return NextResponse.json(links);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = linkSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltig länkdata" }, { status: 400 });
  }

  const maxOrder = await prisma.link.aggregate({
    where: { userId: session.user.id },
    _max: { order: true }
  });

  const order = (maxOrder._max.order ?? 0) + 1;

  const created = await prisma.link.create({
    data: {
      userId: session.user.id,
      order,
      ...parsed.data
    }
  });

  return NextResponse.json(created, { status: 201 });
}
