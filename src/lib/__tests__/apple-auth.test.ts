import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SignJWT,
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type JWTVerifyGetKey,
} from "jose";

/**
 * Sign in with Apple på webben + i iOS-appen. Apple sätter `aud` till den
 * klient som startade inloggningen: bundle ID (native) eller Services ID
 * (webben). Testerna låser fast att båda godtas — men inget annat — och att
 * refresh token från webben återkallas med rätt client_id.
 */

// Apples riktiga JWKS ersätts med ett lokalt nyckelpar.
const jwks: { current: JWTVerifyGetKey | null } = vi.hoisted(() => ({ current: null }));

vi.mock("jose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jose")>();
  return {
    ...actual,
    createRemoteJWKSet: () =>
      ((...args: Parameters<JWTVerifyGetKey>) => {
        if (!jwks.current) throw new Error("JWKS inte initierad");
        return jwks.current(...args);
      }) as JWTVerifyGetKey,
  };
});

const ENV_KEYS = ["APPLE_CLIENT_ID", "APPLE_SERVICES_ID", "NEXT_PUBLIC_APPLE_SERVICES_ID"] as const;
let saved: Record<string, string | undefined> = {};
let privateKey: CryptoKey;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey as CryptoKey;
  const publicJwk = await exportJWK(pair.publicKey);
  jwks.current = createLocalJWKSet({
    keys: [{ ...publicJwk, kid: "test", alg: "RS256", use: "sig" }],
  });
});

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function appleToken(claims: { aud: string; nonce?: string; iss?: string }) {
  const { iss = "https://appleid.apple.com", ...rest } = claims;
  return new SignJWT({ ...rest, email: "test@example.com" })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer(iss)
    .setSubject("001234.abcdef")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
}

async function load() {
  return import("@/lib/apple-auth");
}

describe("verifyAppleIdentityToken — audience", () => {
  it("godtar bundle ID:t (native iOS)", async () => {
    const { verifyAppleIdentityToken } = await load();
    const claims = await verifyAppleIdentityToken(await appleToken({ aud: "se.avyracards.app" }));
    expect(claims.sub).toBe("001234.abcdef");
  });

  it("godtar Services ID:t (webben) när APPLE_SERVICES_ID är satt", async () => {
    process.env.APPLE_SERVICES_ID = "se.avyracards.web";
    const { verifyAppleIdentityToken } = await load();
    const claims = await verifyAppleIdentityToken(await appleToken({ aud: "se.avyracards.web" }));
    expect(claims.aud).toBe("se.avyracards.web");
  });

  it("faller tillbaka på NEXT_PUBLIC_APPLE_SERVICES_ID", async () => {
    process.env.NEXT_PUBLIC_APPLE_SERVICES_ID = "se.avyracards.web";
    const { verifyAppleIdentityToken } = await load();
    await expect(
      verifyAppleIdentityToken(await appleToken({ aud: "se.avyracards.web" }))
    ).resolves.toBeTruthy();
  });

  it("avvisar webbtoken när inget Services ID är konfigurerat", async () => {
    const { verifyAppleIdentityToken } = await load();
    await expect(
      verifyAppleIdentityToken(await appleToken({ aud: "se.avyracards.web" }))
    ).rejects.toThrow();
  });

  it("avvisar främmande audience", async () => {
    process.env.APPLE_SERVICES_ID = "se.avyracards.web";
    const { verifyAppleIdentityToken } = await load();
    await expect(
      verifyAppleIdentityToken(await appleToken({ aud: "com.someone.else" }))
    ).rejects.toThrow();
  });

  it("avvisar fel issuer", async () => {
    const { verifyAppleIdentityToken } = await load();
    await expect(
      verifyAppleIdentityToken(
        await appleToken({ aud: "se.avyracards.app", iss: "https://evil.example" })
      )
    ).rejects.toThrow();
  });
});

describe("verifyAppleIdentityToken — nonce", () => {
  it("godtar matchande nonce och avvisar fel/saknad", async () => {
    process.env.APPLE_SERVICES_ID = "se.avyracards.web";
    const { verifyAppleIdentityToken } = await load();
    const token = await appleToken({ aud: "se.avyracards.web", nonce: "abc123" });

    await expect(verifyAppleIdentityToken(token, { nonce: "abc123" })).resolves.toBeTruthy();
    await expect(verifyAppleIdentityToken(token, { nonce: "fel" })).rejects.toThrow(/nonce/);

    const withoutNonce = await appleToken({ aud: "se.avyracards.web" });
    await expect(verifyAppleIdentityToken(withoutNonce, { nonce: "abc123" })).rejects.toThrow(
      /nonce/
    );
  });
});

describe("client_id för kodväxling/revoke", () => {
  it("mappar audience till rätt klient", async () => {
    process.env.APPLE_SERVICES_ID = "se.avyracards.web";
    const { resolveAppleClientIdFromAudience } = await load();
    expect(resolveAppleClientIdFromAudience("se.avyracards.web")).toBe("se.avyracards.web");
    expect(resolveAppleClientIdFromAudience("se.avyracards.app")).toBe("se.avyracards.app");
    expect(resolveAppleClientIdFromAudience(undefined)).toBe("se.avyracards.app");
  });

  it("sparar native-token oförändrat och webbtoken med prefix", async () => {
    process.env.APPLE_SERVICES_ID = "se.avyracards.web";
    const { encodeAppleRefreshToken, decodeAppleRefreshToken } = await load();

    expect(encodeAppleRefreshToken("se.avyracards.app", "r.native")).toBe("r.native");
    expect(decodeAppleRefreshToken("r.native")).toEqual({
      clientId: "se.avyracards.app",
      refreshToken: "r.native",
    });

    const stored = encodeAppleRefreshToken("se.avyracards.web", "r.web-123");
    expect(stored).toBe("se.avyracards.web|r.web-123");
    expect(decodeAppleRefreshToken(stored)).toEqual({
      clientId: "se.avyracards.web",
      refreshToken: "r.web-123",
    });
  });
});
