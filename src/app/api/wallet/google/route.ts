import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Autentisering
    const session = await auth();
    if (!session || !session.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 2. Hämta miljövariabler
    const { 
      GOOGLE_CLIENT_EMAIL, 
      GOOGLE_PRIVATE_KEY, 
      GOOGLE_WALLET_ISSUER_ID, 
      GOOGLE_WALLET_CLASS_ID 
    } = process.env;

    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_WALLET_ISSUER_ID || !GOOGLE_WALLET_CLASS_ID) {
      throw new Error("Missing Google Wallet environment variables");
    }

    const privateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    // 3. Skapa unikt ID
    // Vi lägger till timestamp för att garantera att ID:t är helt unikt för detta test
    const objectId = `${GOOGLE_WALLET_ISSUER_ID}.${user.id.replace(/-/g, '')}-LIVE-TEST-${Date.now()}`;

    // 4. Bygg ett "Bare Bones" Wallet-objekt
    // INGA BILDER (varken logo eller heroImage)
    // INGA LÄNKAR
    // INGEN STRECKKOD
    const walletObject = {
      id: objectId,
      classId: GOOGLE_WALLET_CLASS_ID,
      state: "ACTIVE",
      textModulesData: [
        {
          header: "STATUS",
          body: "LIVE PRODUCTION TEST",
          id: "status_test"
        },
        {
          header: "NAMN",
          body: user.name || "Testanvändare",
          id: "name"
        }
      ]
    };

    // 5. Skapa JWT payload
    const claims = {
      iss: GOOGLE_CLIENT_EMAIL,
      aud: "google",
      typ: "savetowallet",
      // Vi tar bort 'origins' tillfälligt för att undvika www/non-www mismatch
      payload: {
        walletObjects: [walletObject]
      }
    };

    // 6. Signera token
    const token = jwt.sign(claims, privateKey, { algorithm: "RS256" });

    // 7. Returnera POST-formulär
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Adding to Google Wallet...</title>
        </head>
        <body>
          <form id="walletForm" action="https://pay.google.com/gp/v/save" method="POST">
            <input type="hidden" name="jwt" value="${token}" />
          </form>
          <script>
            document.getElementById("walletForm").submit();
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });

  } catch (error) {
    console.error("Google Wallet Error:", error);
    return new NextResponse("Internal Server Error: " + (error as Error).message, { status: 500 });
  }
}