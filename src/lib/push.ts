import { getFirebaseApp } from "@/lib/firebase-admin";

/**
 * Extra nyttolast som följer med notisen till appen.
 *
 * FCM tillåter bara strängvärden i `data`, så allt normaliseras till sträng
 * innan det skickas. Nycklar med tomt/odefinierat värde utelämnas — en tom
 * sträng i payloaden är svårare att hantera i klienten än en saknad nyckel.
 *
 * `url` är den relativa sökväg appen ska navigera till när notisen trycks
 * (t.ex. "/dashboard/analytics?event=abc123"). Se
 * src/components/push-deep-link.tsx för mottagarsidan.
 */
export type PushData = Record<string, string | number | null | undefined>;

function normalizeData(data?: PushData): Record<string, string> | undefined {
  if (!data) return undefined;

  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    const asString = String(value);
    if (!asString) continue;
    out[key] = asString;
  }

  return Object.keys(out).length ? out : undefined;
}

/**
 * Skickar en push-notis via Firebase Cloud Messaging.
 * Token ska vara en FCM registration token (t.ex. från @capacitor-community/fcm `getToken()`).
 * Firebase sköter sedan leveransen till APNs (via er .p8-konfiguration i Firebase Console).
 *
 * `data` är valfri och bakåtkompatibel: befintliga anrop med tre argument
 * fungerar oförändrat.
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: PushData
): Promise<void> {
  const t = token?.trim();
  if (!t) return;

  const firebase = getFirebaseApp();
  // #region agent log
  if (!firebase) {
    console.log(
      JSON.stringify({ type: "push_debug", message: "Firebase app null, skip send", title })
    );
    return;
  }
  console.log(JSON.stringify({ type: "push_debug", message: "send_start", title }));
  // #endregion
  try {
    const payloadData = normalizeData(data);

    // OBS: `contentAvailable` togs medvetet BORT ur aps-payloaden. En synlig
    // notis + content-available gör att FCM:s iOS-SDK kan re-leverera samma
    // meddelande när appen växlar mellan för- och bakgrund — i praktiken fick
    // användare 2–3 kopior av EN push, minuter isär. Deeplink-datan (`data.url`)
    // följer ändå med notisen och läses vid tryck (push-deep-link.tsx).
    // `apns-collapse-id` gör dessutom att en eventuell om-leverans ERSÄTTER
    // notisen i notiscentret i stället för att staplas som en ny.
    const collapseId = payloadData?.eventId?.slice(0, 64);

    await firebase.messaging().send({
      token: t,
      notification: { title, body },
      ...(payloadData ? { data: payloadData } : {}),
      android: { priority: "high" as const },
      apns: {
        ...(collapseId ? { headers: { "apns-collapse-id": collapseId } } : {}),
        payload: {
          aps: { sound: "default" },
        },
        fcmOptions: {},
      },
    });
    // #region agent log
    console.log(JSON.stringify({ type: "push_debug", message: "send_ok", title }));
    // #endregion
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({
        level: "error",
        type: "push_send_error",
        message: "Firebase push send failed",
        error: msg,
        title,
      })
    );
    // #region agent log
    console.log(
      JSON.stringify({ type: "push_debug", message: "send_failed", title, error: msg })
    );
    // #endregion
  }
}
