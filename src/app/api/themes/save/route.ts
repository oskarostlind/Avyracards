import { NextResponse } from "next/server";
import { auth } from "@/auth"; 
import { prisma } from "@/lib/prisma";
import { ThemeMode } from "@/types/theme"; // Importera typen

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hämta inställningarna OCH mode från request body
    const { settings, mode } = await req.json();
    
    // Default till SOCIAL om mode saknas (för bakåtkompatibilitet)
    const targetMode: ThemeMode = mode || "SOCIAL";

    // Premium check
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true }
    });

    if (!user?.isPremium) {
      // OBS: I framtiden kanske du vill tillåta gratisanvändare att spara basic-inställningar,
      // men just nu är spara-logiken låst till premium i din kod.
      return NextResponse.json(
        { error: "Du måste vara premium för att spara teman." }, 
        { status: 403 }
      );
    }

    // Dynamisk uppdatering baserat på mode
    const updateData = targetMode === "BUSINESS" 
      ? { businessThemeSettings: settings }
      : { themeSettings: settings };

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // Returnera rätt inställningar
    const returnedSettings = targetMode === "BUSINESS" 
      ? updatedUser.businessThemeSettings 
      : updatedUser.themeSettings;

    return NextResponse.json({ success: true, data: returnedSettings });

  } catch (error) {
    console.error("Theme save error:", error);
    return NextResponse.json(
      { error: "Kunde inte spara temat." }, 
      { status: 500 }
    );
  }
}