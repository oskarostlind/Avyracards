import { NextResponse } from "next/server";

/**
 * Digital Asset Links — Androids motsvarighet till AASA-filen
 * (../apple-app-site-association). Låter Android-appen öppna avyracards.se/c/*
 * och /u/* direkt (App Links, se intent-filtret i AndroidManifest.xml).
 *
 * Fingeravtrycken är SHA-256 för certifikaten som signerar appen:
 * - uppladdningsnyckeln (android/keystore — sideloadade test-APK:er)
 * - Google Plays app-signeringsnyckel (det Play-installerade appar signeras
 *   med). Hämtas i Play Console → Test och release → Appintegritet →
 *   App-signering. Kan också sättas utan deploy via env-variabeln
 *   ANDROID_CERT_SHA256 (kommaseparerad).
 *
 * Publika värden, inga hemligheter. Påverkar inte iOS.
 */

// Läs ANDROID_CERT_SHA256 vid anrop, inte vid bygget (annars förrenderas
// routen statiskt och en ny env-variabel kräver ny deploy).
export const dynamic = "force-dynamic";

const PACKAGE_NAME = "se.avyracards.app";

const FINGERPRINTS = [
  // Uppladdningsnyckel (avyracards-upload.jks, alias "upload")
  "D6:F7:A8:E8:08:29:59:5E:C3:AB:72:18:72:47:86:83:18:83:51:DD:EB:3C:F6:76:91:B4:E5:0F:2C:A0:D0:20",
];

function fingerprints(): string[] {
  const fromEnv = (process.env.ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value));
  return Array.from(new Set([...FINGERPRINTS, ...fromEnv]));
}

export function GET() {
  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: PACKAGE_NAME,
          sha256_cert_fingerprints: fingerprints(),
        },
      },
    ],
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
