import { NextResponse } from "next/server";
import { auth } from "@/auth"; // Kontrollera att sökvägen stämmer
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hämta inställningarna från request body
    const settings = await req.json();

    // Vi validerar att användaren är premium innan vi sparar
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true }
    });

    if (!user?.isPremium) {
      return NextResponse.json(
        { error: "Du måste vara premium för att spara teman." }, 
        { status: 403 }
      );
    }

    // Uppdatera användaren med JSON-datan
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        themeSettings: settings, // Prisma hanterar JSON-konverteringen automatiskt
      },
    });

    return NextResponse.json({ success: true, data: updatedUser.themeSettings });

  } catch (error) {
    console.error("Theme save error:", error);
    return NextResponse.json(
      { error: "Kunde inte spara temat." }, 
      { status: 500 }
    );
  }
}