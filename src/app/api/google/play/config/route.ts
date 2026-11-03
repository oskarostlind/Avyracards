import { NextResponse } from "next/server";
import {
  getPlayPackageName,
  getPlayPremiumConfig,
  isGooglePlayConfigured,
  playManageSubscriptionsUrl,
} from "@/lib/google-play";

export const dynamic = "force-dynamic";

/**
 * Publik konfiguration för köpflödet i Android-appen (Google Play Billing).
 * Motsvarar /api/apple/iap/config. Prenumerations- och baserplans-id:n är
 * publika. enabled:false → appen visar "kan inte köpas i Android-appen ännu".
 */
export async function GET() {
  const cfg = getPlayPremiumConfig();
  return NextResponse.json({
    enabled: isGooglePlayConfigured(),
    subscriptionId: cfg.subscriptionId,
    basePlanId: cfg.basePlanId,
    packageName: getPlayPackageName(),
    manageUrl: playManageSubscriptionsUrl(cfg.subscriptionId),
  });
}
