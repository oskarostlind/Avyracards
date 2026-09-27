/**
 * Samlarobjekt (limited edition-drops) — delar som är säkra i klientkod.
 *
 * Ingen Prisma här: filen importeras av feature-access (som körs i både UI
 * och API), av renderarna och av editorn. Databaslogiken ligger i
 * src/lib/collectibles.ts.
 *
 * Modellen: ett Drop är en begränsad upplaga (maxSupply). Ett UserCollectible
 * är ett utdelat exemplar med ett löpnummer som aldrig återanvänds — inte ens
 * om kontot raderas (raden blir kvar med userId = null).
 */

import { COLLECTIBLE_FRAME_STYLES, type CollectibleFrameStyle, type FrameStyle } from "@/types/theme";

/** Första droppet: de 100 första kontona. Id:t är även slug i databasen. */
export const FOUNDERS_DROP_ID = "founders";

/** Vilket drop som krävs för att få använda respektive samlarram. */
export const COLLECTIBLE_FRAME_DROP: Record<CollectibleFrameStyle, string> = {
  founders: FOUNDERS_DROP_ID,
};

/** Det publika profilen/editorn behöver veta om ett ägt objekt. */
export interface ProfileCollectible {
  dropId: string;
  serial: number;
  maxSupply: number;
}

/** Upplagans läge — för FOMO-kortet i editorn och adminvyn. */
export interface DropStatus {
  id: string;
  name: string;
  maxSupply: number;
  issued: number;
  remaining: number;
  soldOut: boolean;
}

export function isCollectibleFrame(frame: FrameStyle | string | undefined | null): frame is CollectibleFrameStyle {
  return !!frame && (COLLECTIBLE_FRAME_STYLES as readonly string[]).includes(frame);
}

/** Drop-id som ramen kräver, eller null om ramen inte är ett samlarobjekt. */
export function requiredDropForFrame(frame: FrameStyle | string | undefined | null): string | null {
  return isCollectibleFrame(frame) ? COLLECTIBLE_FRAME_DROP[frame] : null;
}

/** "042" för 42 av 100, "0042" för 42 av 1000 — alltid lika många siffror som upplagan. */
export function formatSerial(serial: number, maxSupply = 100): string {
  const width = Math.max(3, String(Math.max(1, maxSupply)).length);
  return String(Math.max(0, Math.trunc(serial))).padStart(width, "0");
}

/** Plocka ut ett visst drop ur en lista (null-säker). */
export function findCollectible(
  list: readonly ProfileCollectible[] | null | undefined,
  dropId: string,
): ProfileCollectible | null {
  return list?.find((c) => c.dropId === dropId) ?? null;
}
