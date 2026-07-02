import { SignJWT, jwtVerify } from "jose";

export async function createWalletAccessToken(userId: string): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET saknas");
  }

  const key = new TextEncoder().encode(secret);

  return new SignJWT({ purpose: "wallet-access", userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}

export async function verifyWalletAccessToken(token: string): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET saknas");
  }

  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });

  if (payload.purpose !== "wallet-access" || typeof payload.userId !== "string") {
    throw new Error("Ogiltig wallet-token");
  }

  return payload.userId;
}
