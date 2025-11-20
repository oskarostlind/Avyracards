import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

const reorderSchema = z.object({
  order: z.array(z.string().cuid())
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltig ordning" }, { status: 400 });
  }

  const userId = session.user.id;

  await prisma.$transaction(
    parsed.data.order.map((id, index) =>
      prisma.link.updateMany({
        where: { id, userId },
        data: { order: index }
      })
    )
  );

  return NextResponse.json({ ok: true });
}
