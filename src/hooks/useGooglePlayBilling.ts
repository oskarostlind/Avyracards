"use client";

import { useEffect, useState } from "react";
import { useIsAndroidApp } from "@/hooks/useNativePlatform";

export interface GooglePlayBillingConfig {
  enabled: boolean;
  subscriptionId: string | null;
  basePlanId: string | null;
  packageName: string;
  manageUrl: string;
}

const DISABLED: GooglePlayBillingConfig = {
  enabled: false,
  subscriptionId: null,
  basePlanId: null,
  packageName: "se.avyracards.app",
  manageUrl: "https://play.google.com/store/account/subscriptions",
};

/**
 * Play Billing-konfigurationen för Premium — bara i Android-appen. Utanför
 * Android (iOS-appen, webben) görs inget anrop och värdet förblir null, så
 * de vägarna beter sig exakt som innan.
 *
 * `null` = inte Android eller ännu inte laddat; `enabled:false` = Premium
 * säljs inte i Android-appen (env saknas) → samma text som tidigare.
 */
export function useGooglePlayBilling(): GooglePlayBillingConfig | null {
  const isAndroidApp = useIsAndroidApp();
  const [config, setConfig] = useState<GooglePlayBillingConfig | null>(null);

  useEffect(() => {
    if (!isAndroidApp) return;
    let alive = true;
    fetch("/api/google/play/config", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: GooglePlayBillingConfig | null) => {
        if (!alive) return;
        setConfig(
          data
            ? {
                ...data,
                enabled: Boolean(data.enabled && data.subscriptionId && data.basePlanId),
              }
            : DISABLED
        );
      })
      .catch(() => {
        // Nätverksfel → behandlas som "inte tillgängligt".
        if (alive) setConfig(DISABLED);
      });
    return () => {
      alive = false;
    };
  }, [isAndroidApp]);

  return config;
}

/**
 * Det lokaliserade priset för baserplanen från Google Play ("69,00 kr").
 * null tills det hämtats eller om Play inte svarar — anroparen visar då
 * priset från databasen.
 */
export function useGooglePlayPrice(config: GooglePlayBillingConfig | null): string | null {
  const [price, setPrice] = useState<string | null>(null);

  useEffect(() => {
    if (!config?.enabled || !config.subscriptionId || !config.basePlanId) return;
    let alive = true;
    (async () => {
      try {
        const { NativePurchases, PURCHASE_TYPE } = await import("@capgo/native-purchases");
        const { products } = await NativePurchases.getProducts({
          productIdentifiers: [config.subscriptionId as string],
          productType: PURCHASE_TYPE.SUBS,
        });
        // Android: en rad per erbjudande. identifier = baserplanen,
        // offerId saknas för själva baserplanen.
        const base =
          products.find((p) => p.identifier === config.basePlanId && !p.offerId) ??
          products.find((p) => p.identifier === config.basePlanId);
        if (alive && base?.priceString) setPrice(base.priceString);
      } catch {
        /* behåll DB-priset */
      }
    })();
    return () => {
      alive = false;
    };
  }, [config?.enabled, config?.subscriptionId, config?.basePlanId]);

  return price;
}
