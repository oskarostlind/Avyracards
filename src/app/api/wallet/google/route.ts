import { NextResponse } from "next/server";
import { auth } from "@/auth";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Auth check (kan kommenteras bort om du vill testa helt öppet lokalt)
    const session = await auth();
    if (!session) {
      // return new NextResponse("Unauthorized", { status: 401 }); 
      // Vi släpper igenom det för detta "Bare Bones" test
      console.log("Warning: No session, proceeding anyway for test.");
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

    // --- NYCKELHANTERING (BASE64) ---
    // Detta är KRITISKT för att signaturen ska bli giltig
    let privateKeyString;
    try {
        const decodedBuffer = Buffer.from(GOOGLE_PRIVATE_KEY, 'base64');
        const jsonContent = JSON.parse(decodedBuffer.toString('utf-8'));
        privateKeyString = jsonContent.private_key;
    } catch (e) {
        console.log("Fallback: Using raw string key (check Vercel if this fails)");
        privateKeyString = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    }

    // Unikt ID för detta testobjekt
    const objectId = `${GOOGLE_WALLET_ISSUER_ID}.BARE-BONES-TEST-${Date.now()}`;

    // --- PAYLOAD ---
    // Vi bygger ett "Generic Object" eftersom din klass är av typen "Generic".
    // Vi kan INTE använda "LoyaltyObject" här.
    const genericObject = {
      id: objectId,
      classId: GOOGLE_WALLET_CLASS_ID,
      state: "ACTIVE",
      // OBLIGATORISKT FÖR GENERIC PASS:
      cardTitle: {
        defaultValue: { language: "en-US", value: "TEST CARD" }
      },
      header: {
        defaultValue: { language: "en-US", value: "Bare Bones Test" }
      },
      // Minimal logga för att det ska se ut som något
      logo: {
        sourceUri: { uri: "https://avyracards.se/wallet/logo.png" },
        contentDescription: { defaultValue: { language: "en-US", value: "Logo" } }
      }
    };

    const claims = {
      iss: GOOGLE_CLIENT_EMAIL,
      aud: "google",
      typ: "savetowallet",
      // Vi anger din riktiga domän för att vara på säkra sidan, även om du kör lokalt.
      origins: ["https://avyracards.se"], 
      payload: {
        // VIKTIGT: "genericObjects", inte "loyaltyObjects"
        genericObjects: [genericObject]
      }
    };

    // Signera
    const token = jwt.sign(claims, privateKeyString, { algorithm: "RS256" });

    // Returnera HTML som auto-postar till Google
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Testing Google Wallet...</title></head>
        <body>
            <h1>Sending to Google Wallet...</h1>
            <form id="walletForm" action="https://pay.google.com/gp/v/save" method="POST">
              <input type="hidden" name="jwt" value="${token}" />
              <button type="submit" style="padding: 20px; font-size: 20px;">Click here if not redirected</button>
            </form>
            <script>
              // En liten fördröjning så du hinner se sidan
              setTimeout(() => {
                document.getElementById("walletForm").submit();
              }, 1000);
            </script>
        </body>
      </html>
    `;

    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });

  } catch (error) {
    console.error("Google Wallet Error:", error);
    return new NextResponse("Internal Server Error: " + (error as Error).message, { status: 500 });
  }
}