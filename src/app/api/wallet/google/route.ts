import { NextResponse } from "next/server";
import { auth } from "@/auth";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Auth-check (Nu aktiverad för att fixa ESLint-felet och säkra routen)
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { 
      GOOGLE_CLIENT_EMAIL, 
      GOOGLE_PRIVATE_KEY, 
      GOOGLE_WALLET_ISSUER_ID, 
      GOOGLE_WALLET_CLASS_ID 
    } = process.env;

    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_WALLET_ISSUER_ID || !GOOGLE_WALLET_CLASS_ID) {
      throw new Error("Missing Google Wallet environment variables");
    }

    // --- NYCKEL-FIX (BASE64) ---
    // Vi avkodar Base64-strängen från Vercel tillbaka till vanlig text
    let privateKeyString;
    try {
        // Försök avkoda Base64
        const decodedBuffer = Buffer.from(GOOGLE_PRIVATE_KEY, 'base64');
        const jsonContent = JSON.parse(decodedBuffer.toString('utf-8'));
        // Hämta själva nyckeln ur JSON-objektet
        privateKeyString = jsonContent.private_key;
    } catch (e) {
        // Fallback: Om det inte var Base64 (t.ex. lokalt), försök använda den som den är
        // Vi loggar felet för debugging (använder variabeln 'e' så eslint blir nöjd eller ignorerar)
        console.log("Could not parse as Base64 JSON, trying direct string. Error:", e);
        privateKeyString = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    }

    const objectId = `${GOOGLE_WALLET_ISSUER_ID}.BASE64-TEST-${Date.now()}`;

    // Hårdkodat test-objekt
    const genericObject = {
      id: objectId,
      classId: GOOGLE_WALLET_CLASS_ID,
      state: "ACTIVE",
      logo: {
        sourceUri: { uri: "https://avyracards.se/wallet/logo.png" },
        contentDescription: { defaultValue: { language: "en-US", value: "Avyra Logo" } }
      },
      cardTitle: {
        defaultValue: { language: "en-US", value: "AvyraCards" }
      },
      header: {
        defaultValue: { language: "en-US", value: "Test Person" }
      },
      textModulesData: [
        {
          header: "STATUS",
          body: "Base64 Key Test",
          id: "status"
        }
      ]
    };

    const claims = {
      iss: GOOGLE_CLIENT_EMAIL,
      aud: "google",
      typ: "savetowallet",
      origins: ["https://avyracards.se"],
      payload: {
        genericObjects: [genericObject]
      }
    };

    // Signera
    const token = jwt.sign(claims, privateKeyString, { algorithm: "RS256" });

    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Saving...</title></head>
        <body>
            <form id="walletForm" action="https://pay.google.com/gp/v/save" method="POST">
            <input type="hidden" name="jwt" value="${token}" />
            </form>
            <script>document.getElementById("walletForm").submit();</script>
        </body>
      </html>
    `;

    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });

  } catch (error) {
    console.error("Google Wallet Error:", error);
    return new NextResponse("Internal Server Error: " + (error as Error).message, { status: 500 });
  }
}