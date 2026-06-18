import jwt from "jsonwebtoken";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PremiumSource } from "@prisma/client";
import { getIapProductIds } from "@/lib/ios-native";

interface AppStoreTransactionPayload {
  signedTransactionInfo?: string;
}

interface DecodedTransactionInfo {
  transactionId: string;
  productId: string;
  expiresDate?: number;
  purchaseDate?: number;
  environment?: string;
}

function getAppStorePrivateKey(): string {
  const raw = process.env.APPLE_IAP_PRIVATE_KEY;
  if (!raw) {
    throw new Error("APPLE_IAP_PRIVATE_KEY saknas");
  }
  return raw.replace(/\\n/g, "\n");
}

function createAppStoreApiToken(): string {
  const keyId = process.env.APPLE_IAP_KEY_ID;
  const issuerId = process.env.APPLE_IAP_ISSUER_ID;
  if (!keyId || !issuerId) {
    throw new Error("APPLE_IAP_KEY_ID eller APPLE_IAP_ISSUER_ID saknas");
  }

  return jwt.sign({}, getAppStorePrivateKey(), {
    algorithm: "ES256",
    expiresIn: "5m",
    issuer: issuerId,
    audience: "appstoreconnect-v1",
    keyid: keyId,
  });
}

function getAppStoreBaseUrl(environment?: string): string {
  if (environment === "Sandbox") {
    return "https://api.storekit-sandbox.itunes.apple.com";
  }
  return "https://api.storekit.itunes.apple.com";
}

function decodeSignedTransaction(signedTransactionInfo: string): DecodedTransactionInfo {
  const parts = signedTransactionInfo.split(".");
  if (parts.length < 2) {
    throw new Error("Ogiltig signedTransactionInfo");
  }

  const payload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf8")
  ) as DecodedTransactionInfo;

  if (!payload.transactionId || !payload.productId) {
    throw new Error("Transaktionsdata saknar obligatoriska fält");
  }

  return payload;
}

export async function fetchAppStoreTransaction(
  transactionId: string,
  environmentHint?: string
): Promise<DecodedTransactionInfo> {
  const token = createAppStoreApiToken();
  const baseUrl = getAppStoreBaseUrl(environmentHint);

  const response = await fetch(`${baseUrl}/inApps/v1/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (environmentHint !== "Sandbox") {
      return fetchAppStoreTransaction(transactionId, "Sandbox");
    }
    throw new Error(`App Store API svarade ${response.status}`);
  }

  const data = (await response.json()) as AppStoreTransactionPayload;
  if (!data.signedTransactionInfo) {
    throw new Error("App Store API returnerade ingen transaktion");
  }

  return decodeSignedTransaction(data.signedTransactionInfo);
}

export function resolvePremiumExpiry(productId: string, expiresDate?: number): Date | null {
  if (expiresDate) {
    return new Date(expiresDate);
  }

  const ids = getIapProductIds();
  if (productId === ids.sixMonths) {
    return addMonths(new Date(), 6);
  }
  if (productId === ids.monthly) {
    return addMonths(new Date(), 1);
  }

  return null;
}

export async function grantPremiumFromIap(params: {
  userId: string;
  transactionId: string;
  productId: string;
  environment?: string;
  purchasedAt: Date;
  expiresAt: Date | null;
}): Promise<void> {
  const existing = await prisma.appleIapTransaction.findUnique({
    where: { transactionId: params.transactionId },
  });

  if (existing) {
    return;
  }

  await prisma.$transaction([
    prisma.appleIapTransaction.create({
      data: {
        transactionId: params.transactionId,
        productId: params.productId,
        userId: params.userId,
        environment: params.environment ?? null,
        purchasedAt: params.purchasedAt,
        expiresAt: params.expiresAt,
      },
    }),
    prisma.user.update({
      where: { id: params.userId },
      data: {
        isPremium: true,
        premiumSource: PremiumSource.APPLE_IAP,
        premiumGivenAt: params.purchasedAt,
        premiumExpiresAt: params.expiresAt,
      },
    }),
  ]);
}

export function isKnownIapProduct(productId: string): boolean {
  const ids = getIapProductIds();
  return productId === ids.monthly || productId === ids.sixMonths;
}
