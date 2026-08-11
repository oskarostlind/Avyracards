import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ThemeMode, CustomThemeSettings } from "@/types/theme";
import { sanitizeThemeSettings } from "@/lib/feature-access";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { settings, mode } = await req.json();
    const targetMode: ThemeMode = mode === "BUSINESS" ? "BUSINESS" : "SOCIAL";
    const incoming: Partial<CustomThemeSettings> = settings ?? {};

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true, role: true },
    });

    // All premium-logik bor i src/lib/feature-access.ts — både UI och API
    // frågar samma config, så ett UI-lås som glöms bort inte blir en datalucka.
    const { settings: safeSettings, sanitized, removed } = sanitizeThemeSettings(
      incoming,
      targetMode,
      { isPremium: user?.isPremium, isAdmin: user?.role === "ADMIN" },
    );

    const updateData =
      targetMode === "BUSINESS"
        ? { businessThemeSettings: safeSettings }
        : { themeSettings: safeSettings };

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    const returnedSettings =
      targetMode === "BUSINESS"
        ? updatedUser.businessThemeSettings
        : updatedUser.themeSettings;

    return NextResponse.json({
      success: true,
      data: returnedSettings,
      sanitized,
      removed,
    });
  } catch (error) {
    console.error("Theme save error:", error);
    return NextResponse.json(
      { error: "Kunde inte spara temat." },
      { status: 500 },
    );
  }
}
