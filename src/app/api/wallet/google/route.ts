import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyWalletAccessToken } from "@/lib/wallet-auth";

export const dynamic = 'force-dynamic';

interface WalletClassResponse {
  id?: string;
  [key: string]: unknown;
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
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      return NextResponse.json({ error: 'Server config error: Missing credentials' }, { status: 500 });
    }

    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    const ISSUER_ID = '3388000000023044854';
    
    const CLASS_ID = `${ISSUER_ID}.standard_card_v6`; 
    const OBJECT_ID = `${ISSUER_ID}.user-${user.id}`; 

    const authClient = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    });

    const httpClient = await authClient.getClient();
    const baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1';

    // 3. SKAPA DEN NYA MALLEN (Class v6 - Stacked Layout)
    try {
      const checkClassRes = await httpClient.request<WalletClassResponse>({
        url: `${baseUrl}/genericClass/${CLASS_ID}`,
        method: 'GET',
        validateStatus: (status) => status === 200 || status === 404,
      });

      if (checkClassRes.status === 404) {
        console.log('⚠️ Class v6 not found. Creating new "STACKED" layout template...');
        
        await httpClient.request({
          url: `${baseUrl}/genericClass`,
          method: 'POST',
          data: {
            id: CLASS_ID,
            classTemplateInfo: {
              cardTemplateOverride: {
                cardRowTemplateInfos: [
                  // RAD 1: Namn (Stacked)
                  {
                    oneItem: {
                      item: {
                        predefinedItem: {
                          type: "STACKED",
                          firstValue: { fields: [{ fieldPath: "object.subheader" }] }, 
                          secondValue: { fields: [{ fieldPath: "object.header" }] }   
                        }
                      }
                    }
                  },
                  // RAD 2: Titel/Bio (Stacked)
                  {
                    oneItem: {
                      item: {
                        predefinedItem: {
                          type: "STACKED",
                          firstValue: { fields: [{ fieldPath: "object.textModulesData[0].header" }] },
                          secondValue: { fields: [{ fieldPath: "object.textModulesData[0].body" }] }
                        }
                      }
                    }
                  },
                  // RAD 3: Länk (Stacked)
                  {
                    oneItem: {
                      item: {
                        predefinedItem: {
                          type: "STACKED",
                          firstValue: { fields: [{ fieldPath: "object.textModulesData[1].header" }] },
                          secondValue: { fields: [{ fieldPath: "object.textModulesData[1].body" }] }
                        }
                      }
                    }
                  }
                ]
              }
            },
            reviewStatus: "UNDER_REVIEW", 
          },
        });
        console.log('✅ Class v6 (Stacked) created successfully.');
      }
    } catch (error) {
      console.warn('Class check warning (non-fatal):', error);
    }

    // 4. Data Mapping & URL Fix
    
    // FIX PUNKT 1: Tvinga .se i URL:en
    let baseDomain = process.env.NEXT_PUBLIC_BASE_URL || 'https://avyracards.se';
    baseDomain = baseDomain.replace('.com', '.se'); // Säkerställ att det blir .se
    
    // --- HÄR ÄR ÄNDRINGEN FÖR ANALYTICS ---
    // Vi lägger till ?source=wallet här. Detta är länken QR-koden leder till.
    const profileUrl = `${baseDomain}/u/${user.username}?source=wallet`;
    
    // Visuell länk (utan ?source=wallet för att hålla det snyggt)
    const displayUrl = `avyracards.se/u/${user.username}`;
    
    // FIX PUNKT 2: Google Image URL
    const logoUri = (user.avatarUrl && user.avatarUrl.startsWith('http')) 
      ? user.avatarUrl 
      : 'https://avyracards.se/wallet/logo.png';

    // 5. Bygg Payload
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
            // Värdena (Stor text där nere)
            header: {
              defaultValue: { language: 'en-US', value: user.name || user.username || "Användare" },
            },
            // Etiketterna (Liten text där uppe)
            subheader: {
              defaultValue: { language: 'sv-SE', value: 'NAMN' },
            },
            textModulesData: [
              {
                header: "TITEL",
                body: user.bio || "Digital Profil"
              },
              {
                header: "PROFIL",
                body: displayUrl // Visar den snygga .se länken (utan tracking)
              }
            ],
            barcode: {
              type: "QR_CODE",
              value: profileUrl, // QR-koden innehåller tracking-länken
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

    // 6. Signera och Redirecta
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