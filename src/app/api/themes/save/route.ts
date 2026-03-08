import { NextResponse } from "next/server";
import { auth } from "@/auth"; 
import { prisma } from "@/lib/prisma";
import { ThemeMode, CustomThemeSettings } from "@/types/theme"; 

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { settings, mode } = await req.json();
    const targetMode: ThemeMode = mode || "SOCIAL";
    const userSettings: Partial<CustomThemeSettings> = settings;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true }
    });

    let wasSanitized = false;

    // --- SANERA INSTÄLLNINGAR FÖR GRATISANVÄNDARE ---
    if (!user?.isPremium) {
        
        // 1. Sanera bakgrundsbild (fallback till färg)
        if (userSettings.backgroundType === "image") {
             userSettings.backgroundType = "solid";
             userSettings.backgroundImage = undefined;
             userSettings.backgroundColor = userSettings.backgroundColor || "#0f172a";
             wasSanitized = true;
        }

        // 2. Tvinga branding att visas
        if (userSettings.hideBranding) {
            userSettings.hideBranding = false;
            wasSanitized = true;
        }

        // 3. Sanera premium-knappar (ex. glass)
        if (userSettings.buttonVariant === "glass") {
            userSettings.buttonVariant = "solid";
            wasSanitized = true;
        }
    }

    const updateData = targetMode === "BUSINESS" 
      ? { businessThemeSettings: userSettings }
      : { themeSettings: userSettings };

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    const returnedSettings = targetMode === "BUSINESS" 
      ? updatedUser.businessThemeSettings 
      : updatedUser.themeSettings;

    return NextResponse.json({ 
        success: true, 
        data: returnedSettings,
        sanitized: wasSanitized // <-- Skickar info till frontend om vi ändrade något
    });

  } catch (error) {
    console.error("Theme save error:", error);
    return NextResponse.json(
      { error: "Kunde inte spara temat." }, 
      { status: 500 }
    );
  }
}