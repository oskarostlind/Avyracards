import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

const settingsSchema = z.object({
  theme: z.string().min(2).max(20).optional(),
  font: z.string().min(2).max(30).optional(),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  backgroundUrl: z.string().url().nullable().optional()
});

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ogiltiga inställningar" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data
  });

  return NextResponse.json({ user });
}
