/**
 * Samlarobjekt (limited edition-drops) — databasdelen.
 *
 * Löpnummer delas ut med en atomisk räknare på Drop (issuedCount):
 *
 *   UPDATE "Drop" SET "issuedCount" = "issuedCount" + 1
 *   WHERE id = … AND "issuedCount" < "maxSupply" AND (aktivt fönster)
 *   RETURNING "issuedCount"
 *
 * Postgres låser raden, så två samtidiga registreringar köar på varandra och
 * får olika nummer, och villkoret omprövas efter låset — droppet kan alltså
 * aldrig dela ut fler än maxSupply. Räknaren minskas aldrig: ett raderat konto
 * lämnar sin rad kvar med userId = null (onDelete: SetNull), och numret
 * återanvänds inte. @@unique([dropId, serial]) och @@unique([userId, dropId])
 * är skyddsnät om räknaren någon gång skulle hamna ur fas med tabellen.
 *
 * Tilldelning vid registrering får ALDRIG fälla registreringen:
 * grantSignupCollectibles fångar allt och loggar.
 */

import { Prisma, type CollectibleSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DropStatus, ProfileCollectible } from "@/lib/collectibles-shared";

export { FOUNDERS_DROP_ID } from "@/lib/collectibles-shared";
export type { DropStatus } from "@/lib/collectibles-shared";

const MAX_ATTEMPTS = 3;

export type AllocationResult =
  | { status: "granted"; serial: number }
  | { status: "already_owned"; serial: number }
  | { status: "sold_out" }
  | { status: "unavailable" };

function isUniqueViolation(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

function uniqueTarget(err: Prisma.PrismaClientKnownRequestError): string {
  const target = err.meta?.target;
  return Array.isArray(target) ? target.join(",") : String(target ?? "");
}

/**
 * Dela ut nästa löpnummer i ett drop till en användare.
 *
 * - `requireAutoGrant`: bara drops med autoGrantOnSignup (registreringsflödet).
 *   Admin-/köpvägar sätter false.
 * - Idempotent per användare: äger hen redan objektet returneras det numret.
 * - Kastar vid oväntade databasfel — anroparen avgör om det ska sväljas.
 */
export async function allocateCollectible(
  userId: string,
  dropId: string,
  options: { source: CollectibleSource; requireAutoGrant?: boolean } = { source: "AUTO_EARLY_USER" },
): Promise<AllocationResult> {
  const requireAutoGrant = options.requireAutoGrant ?? options.source === "AUTO_EARLY_USER";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const existing = await prisma.userCollectible.findUnique({
      where: { userId_dropId: { userId, dropId } },
      select: { serial: true },
    });
    if (existing) return { status: "already_owned", serial: existing.serial };

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Atomisk räknare. Villkoren speglar exakt när droppet är "öppet".
        const rows = await tx.$queryRaw<{ issuedCount: number }[]>`
          UPDATE "Drop"
          SET "issuedCount" = "issuedCount" + 1
          WHERE "id" = ${dropId}
            AND "active" = true
            AND "issuedCount" < "maxSupply"
            AND "startsAt" <= NOW()
            AND ("endsAt" IS NULL OR "endsAt" > NOW())
            AND (${requireAutoGrant} = false OR "autoGrantOnSignup" = true)
          RETURNING "issuedCount"
        `;

        const serial = rows[0]?.issuedCount;
        if (serial === undefined) return null;

        // Om det här kastar rullas räknaren tillbaka med transaktionen.
        await tx.userCollectible.create({
          data: { userId, dropId, serial: Number(serial), source: options.source },
        });
        return Number(serial);
      });

      if (result !== null) return { status: "granted", serial: result };

      // Ingen rad uppdaterades: slut, stängt eller finns inte. Skilj på
      // "slut" och "inte tillgängligt" för loggar och admin.
      const drop = await prisma.drop.findUnique({
        where: { id: dropId },
        select: { issuedCount: true, maxSupply: true },
      });
      if (drop && drop.issuedCount >= drop.maxSupply) return { status: "sold_out" };
      return { status: "unavailable" };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      // userId+dropId: en parallell förfrågan hann före — nästa varv hittar
      // raden och svarar already_owned. dropId+serial: räknaren låg efter
      // tabellen (t.ex. en rad inlagd för hand). Transaktionen rullades
      // tillbaka, så flytta räknaren förbi högsta använda numret och försök igen.
      if (uniqueTarget(err).includes("serial")) {
        await prisma.$executeRaw`
          UPDATE "Drop" SET "issuedCount" = GREATEST(
            "issuedCount",
            (SELECT COALESCE(MAX("serial"), 0) FROM "UserCollectible" WHERE "dropId" = ${dropId})
          )
          WHERE "id" = ${dropId}
        `;
      }
      if (attempt === MAX_ATTEMPTS) throw err;
    }
  }

  return { status: "unavailable" };
}

/**
 * Anropas direkt efter att ett konto skapats (e-post, Apple …). Delar ut alla
 * öppna auto-drops. Kastar aldrig — en trasig tilldelning får inte göra att
 * registreringen misslyckas.
 */
export async function grantSignupCollectibles(userId: string): Promise<void> {
  try {
    const drops = await prisma.drop.findMany({
      where: { active: true, autoGrantOnSignup: true },
      select: { id: true },
    });
    for (const drop of drops) {
      try {
        const result = await allocateCollectible(userId, drop.id, { source: "AUTO_EARLY_USER" });
        if (result.status === "granted") {
          console.log(`[collectibles] ${drop.id} #${result.serial} -> ${userId}`);
        }
      } catch (err) {
        console.error(`[collectibles] Kunde inte dela ut ${drop.id} till ${userId}:`, err);
      }
    }
  } catch (err) {
    console.error(`[collectibles] Kunde inte läsa drops för ${userId}:`, err);
  }
}

/** Användarens ägda samlarobjekt, äldst först. Tom lista vid fel. */
export async function getUserCollectibles(userId: string): Promise<ProfileCollectible[]> {
  try {
    const rows = await prisma.userCollectible.findMany({
      where: { userId },
      orderBy: { grantedAt: "asc" },
      select: { dropId: true, serial: true, drop: { select: { maxSupply: true } } },
    });
    return rows.map((r) => ({ dropId: r.dropId, serial: r.serial, maxSupply: r.drop.maxSupply }));
  } catch (err) {
    console.error("[collectibles] getUserCollectibles:", err);
    return [];
  }
}

/** Drop-id:n användaren äger — det sanitizeThemeSettings behöver (AccessUser.collectibles). */
export async function getOwnedDropIds(userId: string): Promise<string[]> {
  return (await getUserCollectibles(userId)).map((c) => c.dropId);
}

export async function ownsCollectible(userId: string, dropId: string): Promise<boolean> {
  const row = await prisma.userCollectible.findUnique({
    where: { userId_dropId: { userId, dropId } },
    select: { id: true },
  });
  return Boolean(row);
}

/** Hur många som delats ut / finns kvar. null om droppet inte finns. */
export async function getDropStatus(dropId: string): Promise<DropStatus | null> {
  try {
    const drop = await prisma.drop.findUnique({
      where: { id: dropId },
      select: { id: true, name: true, maxSupply: true, issuedCount: true },
    });
    if (!drop) return null;
    const issued = Math.min(drop.issuedCount, drop.maxSupply);
    return {
      id: drop.id,
      name: drop.name,
      maxSupply: drop.maxSupply,
      issued,
      remaining: Math.max(0, drop.maxSupply - issued),
      soldOut: issued >= drop.maxSupply,
    };
  } catch (err) {
    console.error("[collectibles] getDropStatus:", err);
    return null;
  }
}
