import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, type RateLimitOptions } from "@/lib/rate-limit";

const publicAvatarRateLimitOptions: RateLimitOptions = {
  windowMs: 60_000,
  max: 60,
};

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;

    if (!username) {
      return new NextResponse("Missing username", { status: 400 });
    }

    const ip =
      request.ip ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const rateKey = `public_avatar:${ip}:${username.toLowerCase()}`;
    const rate = consumeRateLimit(rateKey, publicAvatarRateLimitOptions);

    if (!rate.allowed) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    // 1. Hämta användaren (Bara avatarUrl, inget annat)
    const user = await prisma.user.findUnique({
      where: { username },
      select: { avatarUrl: true }, 
    });

    // 2. Bestäm vilken bild vi ska använda
    // FIX: Tog bort 'user?.image' härifrån
    let avatarData = user?.avatarUrl;

    // Om ingen bild finns, redirecta till standardloggan
    if (!avatarData) {
      return NextResponse.redirect(new URL("/wallet/logo.png", request.url));
    }

    // SCENARIO A: Det är redan en vanlig URL (t.ex. Google-profilbild eller UploadThing)
    if (avatarData.startsWith("http")) {
      return NextResponse.redirect(avatarData);
    }

    // SCENARIO B: Det är Base64 (det vi vill lösa!)
    if (avatarData.startsWith("data:image")) {
      // Formatet ser ut så här: "data:image/png;base64,iVBORw0KGgoAAA..."
      
      // Hitta vilken typ det är (png/jpeg)
      const mimeType = avatarData.substring(5, avatarData.indexOf(";"));
      
      // Ta bort prefixet för att få ren data
      const base64String = avatarData.replace(/^data:image\/\w+;base64,/, "");
      
      // Gör om till Buffer (binär fil)
      const buffer = Buffer.from(base64String, "base64");

      // Skicka tillbaka som en riktig bildfil
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=3600, must-revalidate", // Cacha i 1 timme
        },
      });
    }

    // Fallback om datan är konstig
    return NextResponse.redirect(new URL("/wallet/logo.png", request.url));

  } catch (error) {
    console.error("Avatar Proxy Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}