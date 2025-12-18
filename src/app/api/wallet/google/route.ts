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

    // 4. Hantera URL:er (FIX FÖR LOCALHOST 400 ERROR)
    // Vi skiljer på "appUrl" (där koden körs) och "walletUrl" (vad som står på kortet)
    
    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://avyracards.se";
    
    // VIKTIGT: För Google Wallet måste vi ALLTID använda en publik domän för länkar och bilder.
    // Även om du kör localhost, så måste kortet peka på din live-site.
    // Annars vägrar Google skapa kortet (Error 400).
    const walletBaseUrl = "https://avyracards.se"; 

    // Bild-logik: 
    // Om vi kör lokalt -> Använd statisk logga.
    // Om vi kör live -> Använd proxyn (som nu pekar på live-domänen).
    let heroImageUri;
    if (appUrl.includes("localhost")) {
        console.log("Localhost detected: Using static logo and forcing live URLs for Google Wallet.");
        heroImageUri = `${walletBaseUrl}/wallet/logo.png`;
    } else {
        heroImageUri = `${walletBaseUrl}/api/public/avatar/${user.username}`;
    }

    // 5. Bygg Wallet-objektet
    // OBS: Vi använder 'walletBaseUrl' (live) för alla länkar här nere, inte 'appUrl' (localhost)
    const walletObject = {
      id: objectId,
      classId: GOOGLE_WALLET_CLASS_ID,
      state: "ACTIVE",
      heroImage: {
        sourceUri: {
          uri: heroImageUri
        },
        contentDescription: {
          defaultValue: {
            language: "en-US",
            value: "Profile Image"
          }
        }
      },
      textModulesData: [
        {
          header: "NAMN",
          body: user.name || user.username || "Användare",
          id: "name"
        },
        {
          header: "TITEL",
          body: user.bio || "Digital Profil",
          id: "title"
        },
        {
          header: "PROFIL",
          body: `avyracards.se/u/${user.username}`,
          id: "url"
        }
      ],
      linksModuleData: {
        uris: [
          {
            uri: `${walletBaseUrl}/dashboard`, // Tvingar https://avyracards.se
            description: "Hantera Profil",
            id: "manage_link"
          },
          {
            uri: `${walletBaseUrl}/u/${user.username}`, // Tvingar https://avyracards.se
            description: "Visa Profil",
            id: "view_link"
          }
        ]
      },
      barcode: {
        type: "QR_CODE",
        value: `${walletBaseUrl}/u/${user.username}`, // Tvingar https://avyracards.se
        alternateText: user.username || "Scan"
      }
    };

    // 6. Skapa JWT payload
    const claims = {
      iss: GOOGLE_CLIENT_EMAIL,
      aud: "google", 
      origins: [walletBaseUrl], // Vi säger till Google att detta kommer från live-domänen
      typ: "savetowallet",
      payload: {
        walletObjects: [walletObject]
      }
    };

    // --- DEBUG LOGS ---
    console.log("--- GOOGLE WALLET DEBUG ---");
    console.log("Object ID:", walletObject.id);
    console.log("Using Base URL for Wallet:", walletBaseUrl);
    // ------------------

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