import * as admin from "firebase-admin";

/**
 * Returnerar den initierade Firebase Admin-appen.
 * Initierar endast en gång (skyddar mot dubbel init vid t.ex. Next.js hot-reload).
 * Kräver FIREBASE_SERVICE_ACCOUNT_JSON i miljön (hela JSON som sträng).
 */
export function getFirebaseApp(): admin.app.App | null {
  if (admin.apps.length > 0) {
    const existing = admin.app();
    return existing;
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json || typeof json !== "string") {
    return null;
  }
  try {
    const serviceAccount = JSON.parse(json) as admin.ServiceAccount;
    return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch {
    return null;
  }
}
