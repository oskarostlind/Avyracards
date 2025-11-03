import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "../../auth/[...nextauth]/auth";

const updateSchema = z.object({
  label: z.string().min(1).max(60).optional(),
  url: z.string().url().optional(),
  isVisible: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltiga data" }, { status: 400 });
  }

  const updated = await prisma.link.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: parsed.data,
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Länk saknas" }, { status: 404 });
  }

  const link = await prisma.link.findUnique({ where: { id: params.id } });
  return NextResponse.json({ link });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 401 });
  }

  await prisma.link.deleteMany({ where: { id: params.id, userId: session.user.id } });

  return NextResponse.json({ ok: true });
}
