import { createHash } from "crypto";

/**
 * Dagligt roterande besökarhash — samma teknik som Vercel Web Analytics och
 * Plausible använder för att räkna unika besökare utan cookies:
 *
 *   sha256(dagens datum + hemlighet + IP + user-agent)
 *
 * Egenskaper:
 *  - Ingen rå IP eller user-agent lagras någonsin.
 *  - Hashen roterar vid midnatt (UTC), så en besökare kan inte följas mellan
 *    dagar — "unika besökare per dag" blir exakt, längre perioder blir en
 *    övre gräns (samma person två olika dagar räknas två gånger).
 *  - Hemligheten gör att hashen inte kan slås upp via regnbågstabeller över
 *    kända IP-adresser.
 *
 * Servern (och bara servern) anropar den här — klienten skickar aldrig in
 * något hash-värde själv.
 */
export function computeVisitorHash(
  ip: string | null | undefined,
  userAgent: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!ip) return null;

  const day = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const secret = process.env.ANALYTICS_HASH_SECRET || process.env.NEXTAUTH_SECRET || "";

  return createHash("sha256")
    .update(`${day}|${secret}|${ip}|${userAgent ?? ""}`)
    .digest("hex");
}
