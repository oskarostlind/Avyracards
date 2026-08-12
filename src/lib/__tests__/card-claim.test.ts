import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    card: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { claimCard, generateClaimToken, timingSafeEquals } from "@/lib/card-claim";
import { prisma } from "@/lib/prisma";

const cardStore = prisma.card as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
};

const VALID_TOKEN = "a".repeat(64);
const WRONG_TOKEN = "b".repeat(64);

function unclaimedCard(overrides: Record<string, unknown> = {}) {
  return {
    id: "card-1",
    status: "UNCLAIMED",
    claimToken: VALID_TOKEN,
    assignedUserId: null,
    ...overrides,
  };
}

beforeEach(() => {
  cardStore.findUnique.mockReset();
  cardStore.updateMany.mockReset();
  cardStore.updateMany.mockResolvedValue({ count: 1 });
});

describe("timingSafeEquals", () => {
  it("matchar identiska strängar", () => {
    expect(timingSafeEquals("abc", "abc")).toBe(true);
  });

  it("kastar inte på olika längd", () => {
    expect(timingSafeEquals("abc", "abcdef")).toBe(false);
    expect(timingSafeEquals("", "x")).toBe(false);
  });
});

describe("generateClaimToken", () => {
  it("ger 64 hex-tecken och nytt värde varje gång", () => {
    const a = generateClaimToken();
    const b = generateClaimToken();

    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe("claimCard", () => {
  it("aktiverar kortet när kod och token stämmer", async () => {
    cardStore.findUnique.mockResolvedValue(unclaimedCard());

    const result = await claimCard({
      cardCode: "X7F2P1",
      claimToken: VALID_TOKEN,
      userId: "user-1",
    });

    expect(result).toEqual({ ok: true, cardId: "card-1" });

    const update = cardStore.updateMany.mock.calls[0][0];
    expect(update.where).toEqual({ id: "card-1", status: "UNCLAIMED" });
    expect(update.data.status).toBe("CLAIMED");
    expect(update.data.assignedUserId).toBe("user-1");
    // Token roteras så att en gammal aktiveringslänk inte kan återanvändas.
    expect(update.data.claimToken).toMatch(/^[0-9a-f]{64}$/);
    expect(update.data.claimToken).not.toBe(VALID_TOKEN);
  });

  it("vägrar aktivera helt utan token", async () => {
    cardStore.findUnique.mockResolvedValue(unclaimedCard());

    const result = await claimCard({
      cardCode: "X7F2P1",
      claimToken: undefined,
      userId: "angripare",
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe("missing_token");
    expect(cardStore.updateMany).not.toHaveBeenCalled();
    // Ska inte ens slå upp kortet — koden är inte hemlig.
    expect(cardStore.findUnique).not.toHaveBeenCalled();
  });

  it("vägrar aktivera med fel token", async () => {
    cardStore.findUnique.mockResolvedValue(unclaimedCard());

    const result = await claimCard({
      cardCode: "X7F2P1",
      claimToken: WRONG_TOKEN,
      userId: "angripare",
    });

    expect(result.ok === false && result.reason).toBe("invalid_token");
    expect(cardStore.updateMany).not.toHaveBeenCalled();
  });

  it("kräver kortkod", async () => {
    const result = await claimCard({ cardCode: "  ", claimToken: VALID_TOKEN, userId: "u" });
    expect(result.ok === false && result.reason).toBe("missing_code");
  });

  it("ger 'hittades inte' för okänd kod", async () => {
    cardStore.findUnique.mockResolvedValue(null);

    const result = await claimCard({
      cardCode: "NOPE01",
      claimToken: VALID_TOKEN,
      userId: "u",
    });

    expect(result.ok === false && result.reason).toBe("not_found");
  });

  it("skiljer på 'redan mitt' och 'redan någon annans'", async () => {
    cardStore.findUnique.mockResolvedValue(
      unclaimedCard({ status: "CLAIMED", assignedUserId: "user-1" })
    );
    const mine = await claimCard({
      cardCode: "X7F2P1",
      claimToken: VALID_TOKEN,
      userId: "user-1",
    });
    expect(mine.ok === false && mine.reason).toBe("already_claimed_by_user");

    cardStore.findUnique.mockResolvedValue(
      unclaimedCard({ status: "CLAIMED", assignedUserId: "user-2" })
    );
    const theirs = await claimCard({
      cardCode: "X7F2P1",
      claimToken: VALID_TOKEN,
      userId: "user-1",
    });
    expect(theirs.ok === false && theirs.reason).toBe("already_claimed");
  });

  it("vägrar aktivera spärrade kort", async () => {
    for (const status of ["DISABLED", "LOST"]) {
      cardStore.findUnique.mockResolvedValue(unclaimedCard({ status }));

      const result = await claimCard({
        cardCode: "X7F2P1",
        claimToken: VALID_TOKEN,
        userId: "u",
      });

      expect(result.ok === false && result.reason).toBe("disabled");
    }
  });

  it("hanterar kapplöpning där någon annan hann först", async () => {
    cardStore.findUnique.mockResolvedValue(unclaimedCard());
    cardStore.updateMany.mockResolvedValue({ count: 0 });

    const result = await claimCard({
      cardCode: "X7F2P1",
      claimToken: VALID_TOKEN,
      userId: "u",
    });

    expect(result.ok === false && result.reason).toBe("conflict");
  });
});
