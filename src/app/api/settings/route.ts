import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sanitizeThemeSettings } from "@/lib/feature-access";

export const runtime = "nodejs";

const settingsSchema = z.object({
  theme: z.string().min(2).max(20).optional(),
  
  // NYTT: Hantera JSON för färginställningar (Social + Business)
  themeSettings: z.record(z.any()).optional(),
  businessThemeSettings: z.record(z.any()).optional(),

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

  // Teman måste gå genom samma tvätt som /api/themes/save — annars kunde en
  // gratisanvändare spara premium-värden (och ovaliderad CSS) den här vägen.
  const data = { ...parsed.data };
  if (data.themeSettings || data.businessThemeSettings) {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true, role: true },
    });
    const access = { isPremium: me?.isPremium, isAdmin: me?.role === "ADMIN" };
    if (data.themeSettings) {
      data.themeSettings = sanitizeThemeSettings(data.themeSettings, "SOCIAL", access).settings;
    }
    if (data.businessThemeSettings) {
      data.businessThemeSettings = sanitizeThemeSettings(data.businessThemeSettings, "BUSINESS", access).settings;
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    // Skicka aldrig tillbaka hela user-raden (passwordHash, tokens m.m.).
    select: {
      id: true,
      theme: true,
      themeSettings: true,
      businessThemeSettings: true,
      font: true,
      bio: true,
      avatarUrl: true,
      backgroundUrl: true,
    },
  });

  return NextResponse.json({ user });
}