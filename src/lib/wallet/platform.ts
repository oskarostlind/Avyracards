/**
 * Vilken plånbok som är meningsfull att erbjuda på enheten användaren sitter på.
 *
 * Bakgrund: knapparna för Apple Wallet och Google Wallet visades tidigare på
 * alla enheter. Det innebar att en Android-användare kunde trycka på "Apple
 * Wallet" och få en `.pkpass`-fil som Android inte kan öppna — filen laddades
 * ner och sedan hände ingenting. Åt andra hållet erbjöds Google Wallet på
 * iPhone, där stödet för generiska pass är begränsat.
 *
 * På dator går det inte att avgöra lika säkert (och båda är rimliga: macOS har
 * Wallet, och Google Wallet sparar till kontot), så där visas fortfarande båda.
 */

export type WalletKind = "apple" | "google";

export function walletKindsForUserAgent(userAgent: string | null | undefined): WalletKind[] {
  const ua = (userAgent || "").toLowerCase();

  // Android måste testas före iOS: vissa Android-webbläsare har "like Mac OS X"
  // i sin user agent-sträng.
  if (ua.includes("android")) return ["google"];

  // iPadOS 13+ rapporterar sig som Macintosh — men till skillnad från en Mac
  // har enheten touch. Båda hör hemma i Apple-lägret ändå.
  if (/iphone|ipad|ipod/.test(ua)) return ["apple"];

  return ["apple", "google"];
}
