import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Tvinga dynamisk rendering så vi alltid hämtar senaste datan
export const dynamic = 'force-dynamic';

interface WalletClassResponse {
  id?: string;
  [key: string]: unknown;
}

export async function GET(_req: NextRequest) {
  try {
    console.log('--- Starting Wallet Process (Production Safe) ---');

    // 1. Hämta session och användare
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

    // 2. Credentials & Robust Key Cleaning
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      console.error('Missing credentials in environment variables.');
      return NextResponse.json({ error: 'Server config error: Missing credentials' }, { status: 500 });
    }

    // --- NYCKEL-STÄDNING (Fixar produktionsfelet) ---
    // Om nyckeln är omgiven av citattecken (vanligt fel vid copy-paste i env vars), ta bort dem.
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }

    // Ersätt bokstavliga "\n" (två tecken) med riktiga radbrytningar (ett tecken)
    // Detta krävs oftast när man läser flerradiga nycklar från en miljövariabel-sträng.
    privateKey = privateKey.replace(/\\n/g, '\n');
    // ------------------------------------------------

    const ISSUER_ID = '3388000000023044854';
    
    // Vi behåller v5 eftersom den fungerade lokalt och har rätt layout
    const CLASS_ID = `${ISSUER_ID}.standard_card_v5`; 
    const OBJECT_ID = `${ISSUER_ID}.user-${user.id}`; 

    // 3. Autentisering mot Google
    const authClient = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    });

    const httpClient = await authClient.getClient();
    const baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1';

    // 4. Mall-kontroll (Class Check)
    try {
      // console.log(`Checking status for Class ID: ${CLASS_ID}`);
      const checkClassRes = await httpClient.request<WalletClassResponse>({
        url: `${baseUrl}/genericClass/${CLASS_ID}`,
        method: 'GET',
        validateStatus: (status) => status === 200 || status === 404,
      });

      if (checkClassRes.status === 404) {
        console.log('⚠️ Class v5 not found via API. Creating new layout template...');
        
        await httpClient.request({
          url: `${baseUrl}/genericClass`,
          method: 'POST',
          data: {
            id: CLASS_ID,
            classTemplateInfo: {
              cardTemplateOverride: {
                cardRowTemplateInfos: [
                  // RAD 1: Header (Namn)
                  {
                    twoItems: {
                      startItem: { 
                        firstValue: { fields: [{ fieldPath: "object.header" }] } 
                      },
                      endItem: { 
                        firstValue: { fields: [{ fieldPath: "object.subheader" }] } 
                      }
                    }
                  },
                  // RAD 2: Titel/Bio
                  {
                    oneItem: { 
                      item: { 
                        firstValue: { fields: [{ fieldPath: "object.textModulesData[0].body" }] }, 
                        secondValue: { fields: [{ fieldPath: "object.textModulesData[0].header" }] } 
                      } 
                    }
                  },
                  // RAD 3: Länk
                  {
                    oneItem: { 
                      item: { 
                        firstValue: { fields: [{ fieldPath: "object.textModulesData[1].body" }] }, 
                        secondValue: { fields: [{ fieldPath: "object.textModulesData[1].header" }] } 
                      } 
                    }
                  }
                ]
              }
            },
            reviewStatus: "UNDER_REVIEW", 
          },
        });
        console.log('✅ Class v5 created successfully.');
      }
    } catch (error) {
      console.warn('Class check warning (non-fatal):', error);
    }

    // 5. Data Mapping
    const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/u/${user.username}`;
    
    // Säkerställ att loggan är en publik URL (Google krav)
    const logoUri = (user.avatarUrl && user.avatarUrl.startsWith('http')) 
      ? user.avatarUrl 
      : 'https://avyracards.se/wallet/logo.png';

    // 6. Bygg Payload
    const walletPayload = {
      iss: clientEmail,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      origins: [], 
      payload: {
        genericObjects: [
          {
            id: OBJECT_ID,
            classId: CLASS_ID,
            state: 'ACTIVE',
            cardTitle: {
              defaultValue: { language: 'en-US', value: 'AvyraCards' },
            },
            header: {
              defaultValue: { language: 'en-US', value: user.name || user.username || "Användare" },
            },
            subheader: {
              defaultValue: { language: 'en-US', value: 'NAMN' },
            },
            textModulesData: [
              {
                header: "TITEL",
                body: user.bio || "Digital Profil"
              },
              {
                header: "PROFIL",
                body: `avyracards.com/u/${user.username}`
              }
            ],
            barcode: {
              type: "QR_CODE",
              value: profileUrl,
              alternateText: user.username || "Profil"
            },
            logo: {
              sourceUri: { uri: logoUri },
              contentDescription: {
                defaultValue: { language: 'en-US', value: 'Profile Image' },
              },
            },
            hexBackgroundColor: '#000000', 
          },
        ],
      },
    };

    // 7. Signera JWT
    const token = jwt.sign(walletPayload, privateKey, {
      algorithm: 'RS256',
    });

    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
    
    console.log('🚀 Redirecting user to Google Wallet...');

    return NextResponse.redirect(saveUrl);

  } catch (error) {
    console.error('Fatal Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}