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
    console.log('--- Starting Wallet Process (Auto-Redirect Mode) ---');

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

    // 2. Credentials
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    // Hantera både "riktiga" radbrytningar och text-radbrytningar (\n)
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      return NextResponse.json({ error: 'Server config error: Missing credentials' }, { status: 500 });
    }

    const ISSUER_ID = '3388000000023044854';
    
    // VIKTIGT: Vi byter till v5 för att TVINGA Google att använda den nya layouten (Namn/Titel)
    // Detta ignorerar den gamla "Points"-mallen.
    const CLASS_ID = `${ISSUER_ID}.standard_card_v5`; 
    
    // Objekt-ID kopplas till user.id så användaren uppdaterar samma kort vid nästa klick
    const OBJECT_ID = `${ISSUER_ID}.user-${user.id}`; 

    const authClient = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    });

    const httpClient = await authClient.getClient();
    const baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1';

    // 3. SKAPA DEN NYA MALLEN (Class v5)
    // Denna kod körs bara första gången v5 anropas
    try {
      console.log(`Checking status for Class ID: ${CLASS_ID}`);
      const checkClassRes = await httpClient.request<WalletClassResponse>({
        url: `${baseUrl}/genericClass/${CLASS_ID}`,
        method: 'GET',
        validateStatus: (status) => status === 200 || status === 404,
      });

      if (checkClassRes.status === 404) {
        console.log('⚠️ Class v5 not found. Creating new layout template...');
        
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
                        firstValue: { fields: [{ fieldPath: "object.header" }] } // Användarens Namn
                      },
                      endItem: { 
                        firstValue: { fields: [{ fieldPath: "object.subheader" }] } // Etikett: "NAMN"
                      }
                    }
                  },
                  // RAD 2: Titel/Bio
                  {
                    oneItem: { 
                      item: { 
                        firstValue: { fields: [{ fieldPath: "object.textModulesData[0].body" }] }, // Bio text
                        secondValue: { fields: [{ fieldPath: "object.textModulesData[0].header" }] } // Etikett "TITEL"
                      } 
                    }
                  },
                  // RAD 3: Länk
                  {
                    oneItem: { 
                      item: { 
                        firstValue: { fields: [{ fieldPath: "object.textModulesData[1].body" }] }, // URL text
                        secondValue: { fields: [{ fieldPath: "object.textModulesData[1].header" }] } // Etikett "PROFIL"
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
      } else {
        console.log('✅ Class v5 already exists.');
      }
    } catch (error) {
      console.warn('Class check warning:', error);
    }

    // 4. Mappa datan
    const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/u/${user.username}`;
    
    // Säkerställ att loggan är en publik URL
    const logoUri = (user.avatarUrl && user.avatarUrl.startsWith('http')) 
      ? user.avatarUrl 
      : 'https://avyracards.se/wallet/logo.png';

    // 5. Bygg Payload för Passet
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
            // Toppen av kortet
            cardTitle: {
              defaultValue: { language: 'en-US', value: 'AvyraCards' },
            },
            // Rad 1: Namn
            header: {
              defaultValue: { language: 'en-US', value: user.name || user.username || "Användare" },
            },
            subheader: {
              defaultValue: { language: 'en-US', value: 'NAMN' },
            },
            // Rad 2 & 3: Titel och Länk
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
            // QR Kod
            barcode: {
              type: "QR_CODE",
              value: profileUrl,
              alternateText: user.username || "Profil"
            },
            // Bild
            logo: {
              sourceUri: { uri: logoUri },
              contentDescription: {
                defaultValue: { language: 'en-US', value: 'Profile Image' },
              },
            },
            hexBackgroundColor: '#000000', // Svart bakgrund
          },
        ],
      },
    };

    // 6. Signera JWT
    const token = jwt.sign(walletPayload, privateKey, {
      algorithm: 'RS256',
    });

    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
    
    console.log('🚀 Redirecting user to Google Wallet...');

    // DETTA FIXAR OMDDIRIGERINGEN:
    // Istället för JSON, skickar vi en 307 Redirect som webbläsaren följer direkt.
    return NextResponse.redirect(saveUrl);

  } catch (error) {
    console.error('Fatal Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}