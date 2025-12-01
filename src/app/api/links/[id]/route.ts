import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const updateSchema = z.object({
  label: z.string().min(1).max(60).optional(),
  url: z.string().url().optional(),
  isVisible: z.boolean().optional(),
});

interface Params {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltiga fält." }, { status: 400 });
  }

  const link = await prisma.link.findUnique({ where: { id: params.id } });
  if (!link || link.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (parsed.data.label !== undefined) updateData.title = parsed.data.label;
  if (parsed.data.url !== undefined) updateData.url = parsed.data.url;
  if (parsed.data.isVisible !== undefined)
    updateData.isActive = parsed.data.isVisible;

  const updated = await prisma.link.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({
    id: updated.id,
    label: updated.title,
    url: updated.url,
    isVisible: updated.isActive,
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const link = await prisma.link.findUnique({ where: { id: params.id } });
  if (!link || link.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.link.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
