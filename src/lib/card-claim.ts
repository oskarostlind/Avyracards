import crypto from "crypto";

import { prisma } from "@/lib/prisma";

/**
 * Delad, säker logik för att aktivera (claima) ett fysiskt kort.
 *
 * Bakgrund: kortkoden står tryckt på kortet och syns i NFC-URL:en, så den är
 * INTE en hemlighet. `claimToken` är hemligheten — den delas bara ut av
 * `/c/<cardCode>`-routen till den som fysiskt har kortet i handen.
 *
 * Tidigare kontrollerade `/activate/confirm` ingen token alls och
 * `/api/cards/claim` kontrollerade den bara om anroparen råkade skicka med
 * den. Vem som helst som kände till en kortkod kunde alltså aktivera ett
 * kort som låg oöppnat hos en kund. Här krävs token alltid.
 */

export type ClaimResult =
  | { ok: true; cardId: string }
  | { ok: false; reason: ClaimFailureReason; message: string };

export type ClaimFailureReason =
  | "missing_code"
  | "missing_token"
  | "not_found"
  | "invalid_token"
  | "already_claimed_by_user"
  | "already_claimed"
  | "disabled"
  | "conflict";

/** Jämför två tokens utan att läcka information via svarstid. */
export function timingSafeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  if (bufA.length !== bufB.length) {
    // timingSafeEqual kastar på olika längd. Jämför mot sig själv för att
    // hålla tiden konstant, och returnera false.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

export function generateClaimToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function claimCard(params: {
  cardCode: string | null | undefined;
  claimToken: string | null | undefined;
  userId: string;
}): Promise<ClaimResult> {
  const cardCode = params.cardCode?.trim();
  const claimToken = params.claimToken?.trim();

  if (!cardCode) {
    return {
      ok: false,
      reason: "missing_code",
      message: "Ingen kortkod hittades.",
    };
  }

  if (!claimToken) {
    return {
      ok: false,
      reason: "missing_token",
      message:
        "Aktiveringslänken är ofullständig. Skanna kortet igen med telefonen för att få en giltig länk.",
    };
  }

  const card = await prisma.card.findUnique({
    where: { cardCode },
    select: {
      id: true,
      status: true,
      claimToken: true,
      assignedUserId: true,
    },
  });

  if (!card) {
    return {
      ok: false,
      reason: "not_found",
      message: "Ogiltig kortkod. Kontrollera vad som står på kortet.",
    };
  }

  if (card.status === "DISABLED" || card.status === "LOST") {
    return {
      ok: false,
      reason: "disabled",
      message: "Kortet är spärrat och kan inte aktiveras.",
    };
  }

  if (card.status !== "UNCLAIMED") {
    if (card.assignedUserId === params.userId) {
      return {
        ok: false,
        reason: "already_claimed_by_user",
        message: "Kortet är redan aktiverat på ditt konto.",
      };
    }

    return {
      ok: false,
      reason: "already_claimed",
      message: "Detta kort är redan aktiverat av en annan användare.",
    };
  }

  if (!timingSafeEquals(card.claimToken, claimToken)) {
    return {
      ok: false,
      reason: "invalid_token",
      message:
        "Aktiveringslänken är ogiltig. Skanna kortet igen med telefonen för att få en ny länk.",
    };
  }

  // Atomiskt: villkoret på status ligger i WHERE, så två samtidiga anrop
  // aldrig kan claima samma kort. Token roteras samtidigt så att en gammal
  // aktiveringslänk inte kan återanvändas om kortet senare frigörs (t.ex.
  // när ägaren raderar sitt konto).
  const result = await prisma.card.updateMany({
    where: { id: card.id, status: "UNCLAIMED" },
    data: {
      status: "CLAIMED",
      assignedUserId: params.userId,
      claimedAt: new Date(),
      claimToken: generateClaimToken(),
    },
  });

  if (result.count === 0) {
    return {
      ok: false,
      reason: "conflict",
      message: "Kortet hann aktiveras av någon annan. Ladda om sidan.",
    };
  }

  return { ok: true, cardId: card.id };
}
