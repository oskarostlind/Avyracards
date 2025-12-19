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

    // 2. Hämta och validera miljövariabler
    const { 
      GOOGLE_CLIENT_EMAIL, 
      GOOGLE_PRIVATE_KEY, 
      GOOGLE_WALLET_ISSUER_ID, 
      GOOGLE_WALLET_CLASS_ID,
      NEXT_PUBLIC_BASE_URL
    } = process.env;

    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_WALLET_ISSUER_ID || !GOOGLE_WALLET_CLASS_ID) {
      throw new Error("Missing Google Wallet environment variables");
    }

    const privateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const baseUrl = NEXT_PUBLIC_BASE_URL || "https://avyracards.se";

    // 3. Skapa unikt ID (IssuerID.UserUUID-Timestamp)
    const objectId = `${GOOGLE_WALLET_ISSUER_ID}.${user.id.replace(/-/g, '')}-${Date.now()}`;

    // 4. Hantera Bild-URL
    // Använd Proxy-routen vi byggde för att hantera Base64 och externa bilder säkert
    const heroImageUri = `${baseUrl}/api/public/avatar/${user.username}`;

    // 5. Bygg Wallet-objektet (Fullständig version)
    const walletObject = {
      id: objectId,
      classId: GOOGLE_WALLET_CLASS_ID,
      state: "ACTIVE",
      // Logo/Hero Image
      logo: {
        sourceUri: {
          uri: `${baseUrl}/wallet/logo.png`
        },
        contentDescription: {
          defaultValue: {
            language: "en-US",
            value: "AvyraCards Logo"
          }
        }
      },
      // Huvudbild (Profilbild via proxy)
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
            uri: `${baseUrl}/dashboard`,
            description: "Hantera Profil",
            id: "manage_link"
          },
          {
            uri: `${baseUrl}/u/${user.username}`,
            description: "Visa Profil",
            id: "view_link"
          }
        ]
      },
      barcode: {
        type: "QR_CODE",
        value: `${baseUrl}/u/${user.username}`,
        alternateText: user.username || "Scan"
      }
    };

    // 6. Skapa JWT payload
    const claims = {
      iss: GOOGLE_CLIENT_EMAIL,
      aud: "google",
      origins: [baseUrl], // Bra praxis för live-miljö
      typ: "savetowallet",
      payload: {
        walletObjects: [walletObject]
      }
    };

    // 7. Signera token
    const token = jwt.sign(claims, privateKey, { algorithm: "RS256" });

    // 8. Returnera POST-formulär (Auto-submit)
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