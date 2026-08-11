import { google } from "googleapis";

import {
  buildWalletPassContent,
  type WalletPassUser,
} from "./pass-content";

/**
 * Lifecycle-hantering för Google Wallet-pass (ClickUp 86c777p5w, punkt 5).
 *
 * Problemet som löses: passet skapades tidigare BARA i det ögonblick användaren
 * tryckte "Lägg till i Wallet". Ändrade hen sedan namn, titel, bild eller
 * användarnamn låg det gamla passet kvar oförändrat i telefonen — med en
 * QR-kod som i värsta fall pekade på ett användarnamn som inte längre finns.
 * Google Wallet-objekt är serverägda: en PATCH mot objektet propagerar till
 * alla enheter som har passet sparat. Det är det den här modulen gör.
 */

export const GOOGLE_WALLET_ISSUER_ID =
  process.env.GOOGLE_WALLET_ISSUER_ID || "3388000000023044854";

/**
 * Klassversionen är en del av id:t. Höj den bara när klassmallen ändras på ett
 * sätt som kräver en ny mall — befintliga pass fortsätter peka på den gamla.
 */
export const GOOGLE_WALLET_CLASS_VERSION = "standard_card_v7";

export const GOOGLE_WALLET_API_BASE =
  "https://walletobjects.googleapis.com/walletobjects/v1";

export type GoogleWalletSyncResult =
  | "not-configured"
  | "no-username"
  | "not-saved"
  | "updated"
  | "failed";

export function googleWalletClassId(issuerId = GOOGLE_WALLET_ISSUER_ID): string {
  return `${issuerId}.${GOOGLE_WALLET_CLASS_VERSION}`;
}

export function googleWalletObjectId(
  userId: string,
  issuerId = GOOGLE_WALLET_ISSUER_ID
): string {
  return `${issuerId}.user-${userId}`;
}

/**
 * Nyckeln lagras som en enradig env-variabel och kommer tillbaka med
 * bokstavliga `\n` — och ibland omslutande citattecken beroende på hur den
 * klistrades in. Utan den här tvätten failar signeringen.
 */
export function normalizeGooglePrivateKey(
  raw: string | undefined | null
): string | null {
  if (!raw) return null;

  let key = raw;
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
  }

  key = key.replace(/\\n/g, "\n");
  return key.trim() ? key : null;
}

export function getGoogleWalletCredentials(): {
  clientEmail: string;
  privateKey: string;
} | null {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = normalizeGooglePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  if (!clientEmail || !privateKey) return null;
  return { clientEmail, privateKey };
}

export function isGoogleWalletConfigured(): boolean {
  return getGoogleWalletCredentials() !== null;
}

/**
 * googleapis-fel packar in det intressanta (Googles felmeddelande om vilket
 * fält som är ogiltigt) djupt i response.data. Utan detta loggas bara
 * "Request failed with status code 400", vilket inte går att felsöka på.
 */
export function describeGoogleError(error: unknown): string {
  const err = error as {
    message?: string;
    response?: { status?: number; data?: unknown };
  };

  const status = err?.response?.status;
  const data = err?.response?.data;

  if (data !== undefined) {
    let body: string;
    try {
      body = typeof data === "string" ? data : JSON.stringify(data);
    } catch {
      body = String(data);
    }
    return `HTTP ${status ?? "?"}: ${body.slice(0, 2000)}`;
  }

  return err?.message ?? String(error);
}

/**
 * Bygger hela genericObject-payloaden. Delas av save-flödet (POST/PUT) och
 * lifecycle-synken (PATCH) så att ett uppdaterat pass alltid har exakt samma
 * form som ett nyskapat.
 */
export function buildGoogleWalletObject(
  user: WalletPassUser,
  options: { baseUrl?: string | null; issuerId?: string } = {}
): Record<string, unknown> {
  const issuerId = options.issuerId || GOOGLE_WALLET_ISSUER_ID;
  const content = buildWalletPassContent(user, options.baseUrl);

  return {
    id: googleWalletObjectId(user.id, issuerId),
    classId: googleWalletClassId(issuerId),
    state: "ACTIVE",
    cardTitle: {
      defaultValue: { language: "en-US", value: "AvyraCards" },
    },
    header: {
      defaultValue: { language: "en-US", value: content.displayName },
    },
    subheader: {
      defaultValue: { language: "sv-SE", value: "NAMN" },
    },
    // id:na måste matcha fieldPath i klassmallen (object.textModulesData['titel']).
    textModulesData: [
      { id: "titel", header: "TITEL", body: content.headline },
      { id: "profil", header: "PROFIL", body: content.displayUrl },
    ],
    barcode: {
      type: "QR_CODE",
      value: content.profileUrl,
      alternateText: user.username || "",
    },
    logo: {
      sourceUri: {
        uri: content.imageUrl || `https://avyracards.se/wallet/logo.png`,
      },
      contentDescription: {
        defaultValue: { language: "en-US", value: "Profile Image" },
      },
    },
    hexBackgroundColor: "#000000",
  };
}

async function getGoogleWalletHttpClient() {
  const credentials = getGoogleWalletCredentials();
  if (!credentials) return null;

  const authClient = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.clientEmail,
      private_key: credentials.privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });

  return authClient.getClient();
}

/**
 * Skickar uppdaterad passdata till alla enheter som har passet sparat.
 *
 * Kastar aldrig: den här anropas från profil-sparningen, och en tillfällig
 * Google-störning får inte göra att användarens profil inte går att spara.
 * Existerar inget objekt (404) har användaren aldrig sparat passet — då finns
 * inget att uppdatera och vi ska INTE skapa ett, eftersom ett pass som ingen
 * bett om bara skulle kosta API-anrop.
 */
export async function syncGoogleWalletPass(
  user: WalletPassUser,
  options: { baseUrl?: string | null } = {}
): Promise<GoogleWalletSyncResult> {
  if (!user.username) return "no-username";

  try {
    const httpClient = await getGoogleWalletHttpClient();
    if (!httpClient) return "not-configured";

    const objectId = googleWalletObjectId(user.id);
    const objectUrl = `${GOOGLE_WALLET_API_BASE}/genericObject/${encodeURIComponent(
      objectId
    )}`;

    const existing = await httpClient.request({
      url: objectUrl,
      method: "GET",
      validateStatus: (status: number) => status === 200 || status === 404,
    });

    if (existing.status === 404) return "not-saved";

    await httpClient.request({
      url: objectUrl,
      method: "PATCH",
      data: buildGoogleWalletObject(user, {
        baseUrl: options.baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL,
      }),
    });

    return "updated";
  } catch (error) {
    console.error(
      "Google Wallet: kunde inte synka passet:",
      describeGoogleError(error)
    );
    return "failed";
  }
}

/**
 * Ogiltigförklarar passet, t.ex. när kontot raderas. Ett EXPIRED-objekt ligger
 * kvar i användarens Wallet men markeras som utgånget i stället för att fortsätta
 * visa en QR-kod mot en profil som inte finns kvar.
 */
export async function expireGoogleWalletPass(
  userId: string
): Promise<GoogleWalletSyncResult> {
  try {
    const httpClient = await getGoogleWalletHttpClient();
    if (!httpClient) return "not-configured";

    const objectUrl = `${GOOGLE_WALLET_API_BASE}/genericObject/${encodeURIComponent(
      googleWalletObjectId(userId)
    )}`;

    const existing = await httpClient.request({
      url: objectUrl,
      method: "GET",
      validateStatus: (status: number) => status === 200 || status === 404,
    });

    if (existing.status === 404) return "not-saved";

    await httpClient.request({
      url: objectUrl,
      method: "PATCH",
      data: { state: "EXPIRED" },
    });

    return "updated";
  } catch (error) {
    console.error(
      "Google Wallet: kunde inte ogiltigförklara passet:",
      describeGoogleError(error)
    );
    return "failed";
  }
}
