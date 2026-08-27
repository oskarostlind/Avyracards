import { NextResponse } from "next/server";

/**
 * Apple App Site Association (AASA) — krävs för Universal Links.
 *
 * När iOS-appen (med Associated Domains-entitlement för applinks:avyracards.se)
 * installeras hämtar Apples CDN den här filen och lär enheten att länkar till
 * /c/* och /u/* ska öppna appen i stället för Safari. Användare utan appen
 * påverkas inte alls — de hamnar i webbläsaren som vanligt.
 *
 * Medvetet BARA /c (kortlänkar) och /u (profiler): admin, dashboard och
 * checkout ska fortsätta öppnas där länken klickades.
 *
 * OBS: Apple cachar filen hårt (uppdateras vid appinstallation/-uppdatering,
 * via apple-cdn med viss fördröjning). Route handler i stället för statisk fil
 * i public/ för att garantera Content-Type: application/json utan filändelse.
 */

const TEAM_ID = "YB37882LDC";
const BUNDLE_ID = "se.avyracards.app";
const APP_ID = `${TEAM_ID}.${BUNDLE_ID}`;

export function GET() {
  return NextResponse.json(
    {
      applinks: {
        // "apps" (tom array) + "details" med både appID och appIDs täcker
        // äldre och nyare iOS-versioner.
        apps: [],
        details: [
          {
            appID: APP_ID,
            appIDs: [APP_ID],
            paths: ["/c/*", "/u/*"],
            components: [{ "/": "/c/*" }, { "/": "/u/*" }],
          },
        ],
      },
      webcredentials: {
        apps: [APP_ID],
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
