import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        themeSettings: data, // Sparar JSON direkt
        theme: "custom",     // Sätter temat till 'custom' automatiskt
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Theme save error:", error);
    return NextResponse.json({ error: "Failed to save theme" }, { status: 500 });
  }
}