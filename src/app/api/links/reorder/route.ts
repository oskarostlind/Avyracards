import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const reorderSchema = z.object({
  order: z.array(z.string().cuid()),
});

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

  // Uppdateringarna sorteras på id så att två samtidiga anrop alltid låser
  // raderna i samma ordning — annars kan de låsa varandra (Postgres deadlock
  // 40P01, reproducerat i e2e vid snabba flyttar).
  const updates = parsed.data.order
    .map((id, index) => ({ id, index }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  await prisma.$transaction(
    updates.map(({ id, index }) =>
      prisma.link.updateMany({
        where: { id, userId },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
