import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  theme: z.string().max(50).optional(),
  font: z.string().max(50).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  backgroundUrl: z.string().url().optional().nullable()
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { links: { orderBy: { order: "asc" } } }
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltiga fält." }, { status: 400 });
  }

  const data = parsed.data;

  const updated = await prisma.user.update({
    where: { email: session.user.email },
    data
  });

  return NextResponse.json(updated);
}
