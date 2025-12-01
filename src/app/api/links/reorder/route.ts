import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const reorderSchema = z.object({
  order: z.array(z.string().cuid()),
});

async function syncRedirectFlag(userId: string) {
  const activeCount = await prisma.link.count({
    where: { userId, isActive: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { redirectEnabled: activeCount > 0 },
  });
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 401 });
  }

  const userId = session.user.id;

  const body = await req.json();
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltig ordning" }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.order.map((id, index) =>
      prisma.link.updateMany({
        where: { id, userId },
        data: { order: index },
      })
    )
  );

  await syncRedirectFlag(userId);

  return NextResponse.json({ ok: true });
}
