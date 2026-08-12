import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  username: z.string().min(1).max(64),
});

/**
 * Guideline 1.2 kräver att en användare kan blockera en annan användare.
 * En blockering här betyder: den blockerade profilen visas inte längre för
 * mig, och jag räknas inte i dess statistik.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { username: parsed.data.username.toLowerCase() },
    select: { id: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Profilen hittades inte" }, { status: 404 });
  }

  if (target.id === session.user.id) {
    return NextResponse.json(
      { error: "Du kan inte blockera dig själv." },
      { status: 400 }
    );
  }

  await prisma.userBlock.upsert({
    where: {
      blockerId_blockedId: { blockerId: session.user.id, blockedId: target.id },
    },
    create: { blockerId: session.user.id, blockedId: target.id },
    update: {},
  });

  return NextResponse.json({ success: true, blocked: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { username: parsed.data.username.toLowerCase() },
    select: { id: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Profilen hittades inte" }, { status: 404 });
  }

  await prisma.userBlock.deleteMany({
    where: { blockerId: session.user.id, blockedId: target.id },
  });

  return NextResponse.json({ success: true, blocked: false });
}
