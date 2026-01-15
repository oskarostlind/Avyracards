import { NextResponse } from "next/server";
import { auth } from "@/auth"; 
import { prisma } from "@/lib/prisma";
import { ThemeMode } from "@/types/theme"; 

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { settings, mode } = await req.json();
    const targetMode: ThemeMode = mode || "SOCIAL";

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true }
    });

    // --- VALIDERERA INNEHÅLLET ISTÄLLET FÖR ANVÄNDAREN ---
    if (!user?.isPremium) {
        
        // 1. Kolla om de försöker använda en bild (Premium-funktion)
        if (settings.backgroundType === "image") {
             return NextResponse.json(
                { error: "Egna bakgrundsbilder kräver Premium." }, 
                { status: 403 }
             );
        }

        // Här kan vi lägga till fler kontroller senare om vi vill blockera specifika färgkombinationer,
        // men just nu släpper vi igenom allt utom bilder för gratisanvändare.
    }

    // Spara som vanligt
    const updateData = targetMode === "BUSINESS" 
      ? { businessThemeSettings: settings }
      : { themeSettings: settings };

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

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