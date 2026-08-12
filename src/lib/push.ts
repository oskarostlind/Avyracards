import { getFirebaseApp } from "@/lib/firebase-admin";

/**
 * Skickar en push-notis via Firebase Cloud Messaging.
 * Token ska vara en FCM registration token (t.ex. från @capacitor-community/fcm `getToken()`).
 * Firebase sköter sedan leveransen till APNs (via er .p8-konfiguration i Firebase Console).
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string
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
    await firebase.messaging().send({
      token: t,
      notification: { title, body },
      android: { priority: "high" as const },
      apns: {
        payload: { aps: { sound: "default", contentAvailable: true } },
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
