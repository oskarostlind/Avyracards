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
    const objectId = `${GOOGLE_WALLET_ISSUER_ID}.${user.id.replace(/-/g, '')}-${Date.now()}`;

    // 4. URL-hantering (Endast för länkarna inuti kortet)
    const walletBaseUrl = "https://avyracards.se"; 

    // 5. Bygg ett EXTREMT förenklat Wallet-objekt för att testa kopplingen
    const walletObject = {
      id: objectId,
      classId: GOOGLE_WALLET_CLASS_ID,
      state: "ACTIVE",
      // VIKTIGT: Vi tar bort logo, barcode och linksModuleData helt.
      // Om detta funkar så var det något fel med URL:erna eller formatet i de modulerna.
      textModulesData: [
        {
          header: "STATUS",
          body: "Koppling fungerar!",
          id: "status_test"
        }
      ]
    };

    // 6. Skapa JWT payload
    const claims = {
      iss: GOOGLE_CLIENT_EMAIL,
      aud: "google",
      // VIKTIGT: Vi tar bort 'origins' helt. Det är den vanligaste orsaken till 400-fel.
      // origins: [walletBaseUrl], 
      typ: "savetowallet",
      payload: {
        walletObjects: [walletObject]
      }
    };

    // 7. Signera token
    const token = jwt.sign(claims, privateKey, { algorithm: "RS256" });

    // 8. Returnera POST-formulär
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