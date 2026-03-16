import * as admin from "firebase-admin";
import { getFirebaseApp } from "@/lib/firebase-admin";

/**
 * Skickar en push-notis via Firebase Cloud Messaging.
 * Token ska vara FCM registration token (från t.ex. @capacitor-community/fcm getToken()).
 * Om Firebase inte är konfigurerad eller skickandet misslyckas loggas det utan att kasta.
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string
): Promise<void> {
  if (!token?.trim()) return;
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
      token: token.trim(),
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
