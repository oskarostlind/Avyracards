import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  icon: z.string().max(50).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional()
});

interface Params {
  params: { id: string };
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltiga fält." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const link = await prisma.link.findUnique({
    where: { id: params.id }
  });

  if (!link || link.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.link.update({
    where: { id: params.id },
    data: parsed.data
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const link = await prisma.link.findUnique({
    where: { id: params.id }
  });

  if (!link || link.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.link.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
