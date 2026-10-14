/**
 * Vilken plattform webbappen körs i: iOS-appen, Android-appen eller en vanlig
 * webbläsare.
 *
 * Bakgrund: koden skrevs när iOS var enda native-skalet, så `useIsApp()`
 * (= Capacitor.isNativePlatform()) har fått betyda "iOS-appen" på många
 * ställen — StoreKit-köp, Sign in with Apple, "Hantera i App Store". I
 * Android-appen är isNativePlatform() också true, så de Apple-specifika
 * vägarna måste dessutom kräva att plattformen faktiskt är "ios".
 *
 * Capacitor.getPlatform() returnerar alltid "ios" i iOS-appen, så varje
 * villkor som skärps från `isApp` till `isIosApp` ger exakt samma resultat
 * för befintliga iOS-användare.
 */
export type NativePlatform = "ios" | "android" | "web";

interface CapacitorWindow extends Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
  };
}

/** Läser plattformen från Capacitor-bryggan. Endast klientsidan. */
export function detectNativePlatform(): NativePlatform {
  if (typeof window === "undefined") return "web";
  const capacitor = (window as CapacitorWindow).Capacitor;
  if (capacitor?.isNativePlatform?.() !== true) return "web";
  const platform = capacitor.getPlatform?.();
  if (platform === "android") return "android";
  // Native men okänd plattform behandlas som iOS — så betedde sig koden innan
  // Android fanns, vilket håller iOS-appen oförändrad.
  return "ios";
}
