import { timingSafeEqual } from "node:crypto";

/**
 * Bearer-kontroll för /api/stats (ARCHITECTURE.md §2). Fail closed: saknad token-env
 * eller saknad/felaktig header → false. Jämförelsen sker i konstant tid på lika långa buffertar.
 */
export function isStatsAuthorized(authorization: string | null | undefined, token: string | undefined): boolean {
  if (!token) return false;
  const match = /^Bearer\s+(.+)$/i.exec(authorization?.trim() ?? "");
  if (!match) return false;
  const provided = Buffer.from(match[1].trim());
  const expected = Buffer.from(token);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}
