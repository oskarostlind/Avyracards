import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyWalletAccessToken } from "@/lib/wallet-auth";
import {
  buildGoogleWalletObject,
  describeGoogleError,
  getGoogleWalletCredentials,
  googleWalletClassId,
  googleWalletObjectId,
  GOOGLE_WALLET_API_BASE,
  GOOGLE_WALLET_ISSUER_ID,
} from "@/lib/wallet/google";

export const dynamic = 'force-dynamic';

interface WalletClassResponse {
  id?: string;
  [key: string]: unknown;
}

/**
 * Passet öppnas med window.open i en ny flik, så ett JSON-svar skulle visas
 * som rå text för användaren. Returnera en läsbar sida i stället.
 */
function walletErrorPage(message: string, status: number) {
  const safe = message.replace(/[<>&]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;"
  );

  return new NextResponse(
    `<!doctype html><html lang="sv"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>Wallet – AvyraCards</title>` +
      `<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;` +
      `background:#030712;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:24px}` +
      `div{max-width:22rem;text-align:center}h1{font-size:1.1rem;margin:0 0 .5rem}` +
      `p{color:#94a3b8;font-size:.9rem;line-height:1.5;margin:0}</style></head>` +
      `<body><div><h1>Kortet kunde inte sparas</h1><p>${safe}</p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: NextRequest) {
  try {
    console.log('--- Starting Wallet Process (UI Update v6) ---');

    // 1. Hämta session och användare. Passet öppnas via target="_blank" i
    // systemwebbläsaren, som inte delar Capacitor-WebViewens sessionscookie,
    // så tillåt även en kortlivad access-token i query-strängen.
    const accessToken = req.nextUrl.searchParams.get("token");

    let userId: string | undefined;

    if (accessToken) {
      try {
        userId = await verifyWalletAccessToken(accessToken);
      } catch {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    } else {
      const session = await auth();
      if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      const sessionUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (!sessionUser) {
        return new NextResponse("User not found", { status: 404 });
      }
      userId = sessionUser.id;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 2. Credentials & Key Cleaning
    // Nyckeltvätten bor i @/lib/wallet/google så att lifecycle-synken använder
    // exakt samma hantering som save-flödet.
    const credentials = getGoogleWalletCredentials();

    if (!credentials) {
      console.error('Google Wallet: GOOGLE_CLIENT_EMAIL eller GOOGLE_PRIVATE_KEY saknas');
      return walletErrorPage('Google Wallet är inte konfigurerat på servern.', 500);
    }

    const { clientEmail, privateKey } = credentials;

    // v7: v6-klassen kunde aldrig skapas eftersom payloaden var ogiltig
    // (se kommentaren vid klasskapandet nedan). Ny id ger en ren start.
    const CLASS_ID = googleWalletClassId();
    const OBJECT_ID = googleWalletObjectId(user.id);

    const authClient = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    });

    const httpClient = await authClient.getClient();
    const baseUrl = GOOGLE_WALLET_API_BASE;

    // 3. SKAPA MALLEN (Class v7)
    //
    // FIX (ClickUp 86ca6yh4y): v6-payloaden var ogiltig på tre punkter och
    // avvisades av Wallet-API:t med 400 varje gång, vilket doldes av
    // catch-blocket nedan ("non-fatal"). Följdeffekten var att klassen aldrig
    // fanns, objektet därför inte kunde skapas, och koden föll tillbaka på att
    // stoppa HELA objektet i JWT:n — en save-URL på flera tusen tecken, som är
    // just det Google Wallet på Android inte klarar.
    //
    // De tre felen:
    //  1. `reviewStatus` finns inte på GenericClass (bara på t.ex. LoyaltyClass).
    //  2. `predefinedItem` är en ENUM (FREQUENT_FLYER_...), inte ett objekt.
    //     Rätt sätt att få label-över-värde är `item.firstValue` som pekar på
    //     en textModulesData-post — Wallet renderar header som label och body
    //     som värde automatiskt.
    //  3. textModulesData refereras med id, inte index:
    //     object.textModulesData['titel'] — inte object.textModulesData[0].body
    try {
      const checkClassRes = await httpClient.request<WalletClassResponse>({
        url: `${baseUrl}/genericClass/${CLASS_ID}`,
        method: 'GET',
        validateStatus: (status) => status === 200 || status === 404,
      });

      if (checkClassRes.status === 404) {
        console.log('⚠️ Class v7 not found. Creating template...');

        await httpClient.request({
          url: `${baseUrl}/genericClass`,
          method: 'POST',
          data: {
            id: CLASS_ID,
            // Passet ska kunna ligga på flera enheter samtidigt.
            multipleDevicesAndHoldersAllowedStatus: 'MULTIPLE_HOLDERS',
            classTemplateInfo: {
              cardTemplateOverride: {
                cardRowTemplateInfos: [
                  // Namnet renderas redan av object.header/subheader högst upp,
                  // så raderna används till titel och profil-länk.
                  {
                    oneItem: {
                      item: {
                        firstValue: {
                          fields: [{ fieldPath: "object.textModulesData['titel']" }],
                        },
                      },
                    },
                  },
                  {
                    oneItem: {
                      item: {
                        firstValue: {
                          fields: [{ fieldPath: "object.textModulesData['profil']" }],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        });
        console.log('✅ Class v7 created successfully.');
      }
    } catch (error) {
      // Tidigare svaldes det här tyst, vilket är exakt varför buggen kunde
      // ligga kvar. Logga hela API-svaret och avbryt — utan klass blir passet
      // ändå trasigt, och det är bättre att felet syns.
      console.error('Google Wallet class create/check failed:', describeGoogleError(error));
      return walletErrorPage(
        'Kunde inte förbereda Wallet-passet just nu. Försök igen om en stund.',
        502
      );
    }

    // 4. Data Mapping & URL Fix

    // Ett pass utan användarnamn skulle ge en QR-kod som pekar på /u/null.
    if (!user.username) {
      return walletErrorPage(
        'Du måste välja ett användarnamn innan du kan spara kortet i Wallet.',
        400
      );
    }

    // 5. Bygg pass-objektet.
    //
    // Innehållet (namn, titel, bild, QR-länk) byggs av @/lib/wallet/pass-content
    // via buildGoogleWalletObject, så att ett pass som uppdateras i efterhand av
    // lifecycle-synken får exakt samma form som ett nyskapat — och så att passet
    // följer samma fallback-regler som den publika profilen (BUSINESS-läge
    // använder businessAvatarUrl och businessHeadline).
    const genericObject = buildGoogleWalletObject(user, {
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      issuerId: GOOGLE_WALLET_ISSUER_ID,
    });

    // 6. Skapa/uppdatera objektet via Wallet-API:t och signera en "tunn" JWT.
    //
    // FIX (Android, ClickUp 86ca6yh4y): tidigare låg HELA objektet i JWT:n,
    // vilket gav en save-URL på flera tusen tecken. Google rekommenderar att
    // JWT:n hålls under ~1800 tecken eftersom långa URL:er misslyckas i vissa
    // miljöer — i praktiken just Android ("Något gick fel" i Google Wallet).
    // Genom att skapa objektet server-side kan JWT:n bara innehålla
    // id + classId, vilket ger en kort URL som fungerar överallt.
    // Bonus: passet uppdateras med senaste namn/bio/bild vid varje tryck.
    const jwtObjectPayload: Record<string, unknown> = { id: OBJECT_ID, classId: CLASS_ID };

    try {
      const objectUrl = `${baseUrl}/genericObject/${encodeURIComponent(OBJECT_ID)}`;
      const checkObjectRes = await httpClient.request<WalletClassResponse>({
        url: objectUrl,
        method: 'GET',
        validateStatus: (status) => status === 200 || status === 404,
      });

      if (checkObjectRes.status === 404) {
        await httpClient.request({
          url: `${baseUrl}/genericObject`,
          method: 'POST',
          data: genericObject,
        });
        console.log('✅ Wallet object created via API.');
      } else {
        await httpClient.request({
          url: objectUrl,
          method: 'PUT',
          data: genericObject,
        });
        console.log('✅ Wallet object updated via API.');
      }
    } catch (error) {
      // Ingen fat-JWT-fallback längre: den gav en save-URL på flera tusen
      // tecken, vilket är precis det som gör att Android misslyckas. Bättre
      // att felet syns än att Android-användare får "Något gick fel".
      console.error('Google Wallet object insert/update failed:', describeGoogleError(error));
      return walletErrorPage(
        'Kunde inte skapa Wallet-passet just nu. Försök igen om en stund.',
        502
      );
    }

    const walletPayload = {
      iss: clientEmail,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      origins: [],
      payload: {
        genericObjects: [jwtObjectPayload],
      },
    };

    const token = jwt.sign(walletPayload, privateKey, {
      algorithm: 'RS256',
    });

    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
    
    console.log('🚀 Redirecting user to Google Wallet v6...');

    return NextResponse.redirect(saveUrl);

  } catch (error) {
    console.error('Fatal Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}