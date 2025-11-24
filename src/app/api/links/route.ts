import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const createLinkSchema = z.object({
  label: z.string().min(1).max(60),
  url: z.string().url(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await prisma.link.findMany({
    where: { userId: session.user.id },
    orderBy: { order: "asc" },
  });

  const mapped = links.map((l) => ({
    id: l.id,
    label: l.title,
    url: l.url,
    isVisible: l.isActive,
  }));

  return NextResponse.json({ links: mapped });
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const parsed = createLinkSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltiga fält." }, { status: 400 });
  }

  const { label, url } = parsed.data;

  const maxOrder = await prisma.link.aggregate({
    where: { userId: session.user.id },
    _max: { order: true },
  });

  const created = await prisma.link.create({
    data: {
      userId: session.user.id,
      title: label,
      url,
      order: (maxOrder._max.order ?? 0) + 1,
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
}
