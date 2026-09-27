import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

/*
 * Tilldelningslogiken mot en liten simulerad databas. $queryRaw spelar den
 * atomiska räknaren (UPDATE … WHERE issuedCount < maxSupply RETURNING) och
 * userCollectible.create upprätthåller båda unique-constrainten, så att
 * testerna täcker samma regler som Postgres.
 */

type DropRow = {
  id: string;
  maxSupply: number;
  issuedCount: number;
  active: boolean;
  autoGrantOnSignup: boolean;
};
type Row = { userId: string | null; dropId: string; serial: number; source: string };

const db = vi.hoisted(() => ({ drops: [] as DropRow[], rows: [] as Row[], failCreate: null as null | Error }));

function p2002(target: string[]) {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });
}

vi.mock("@/lib/prisma", () => {
  const userCollectible = {
    findUnique: vi.fn(async ({ where }: any) => {
      const { userId, dropId } = where.userId_dropId;
      const r = db.rows.find((x) => x.userId === userId && x.dropId === dropId);
      return r ? { id: "x", serial: r.serial } : null;
    }),
    create: vi.fn(async ({ data }: any) => {
      if (db.failCreate) throw db.failCreate;
      if (db.rows.some((x) => x.dropId === data.dropId && x.serial === data.serial)) throw p2002(["dropId", "serial"]);
      if (db.rows.some((x) => x.userId === data.userId && x.dropId === data.dropId)) throw p2002(["userId", "dropId"]);
      db.rows.push({ ...data });
      return data;
    }),
    findMany: vi.fn(async ({ where }: any) =>
      db.rows
        .filter((r) => r.userId === where.userId)
        .map((r) => ({ dropId: r.dropId, serial: r.serial, drop: { maxSupply: db.drops.find((d) => d.id === r.dropId)!.maxSupply } })),
    ),
  };
  const drop = {
    findUnique: vi.fn(async ({ where }: any) => db.drops.find((d) => d.id === where.id) ?? null),
    findMany: vi.fn(async () => db.drops.filter((d) => d.active && d.autoGrantOnSignup).map((d) => ({ id: d.id }))),
  };
  // Tagged template: values = [dropId, requireAutoGrant]
  const queryRaw = vi.fn(async (_strings: TemplateStringsArray, dropId: string, requireAutoGrant: boolean) => {
    const d = db.drops.find((x) => x.id === dropId);
    if (!d || !d.active || d.issuedCount >= d.maxSupply) return [];
    if (requireAutoGrant && !d.autoGrantOnSignup) return [];
    d.issuedCount += 1;
    return [{ issuedCount: d.issuedCount }];
  });
  const executeRaw = vi.fn(async (_strings: TemplateStringsArray, dropId: string) => {
    const d = db.drops.find((x) => x.id === dropId)!;
    const max = Math.max(0, ...db.rows.filter((r) => r.dropId === dropId).map((r) => r.serial));
    d.issuedCount = Math.max(d.issuedCount, max);
    return 1;
  });
  const prisma: any = { userCollectible, drop, $queryRaw: queryRaw, $executeRaw: executeRaw };
  // Transaktion: kör callbacken; kastar den återställs räknaren (rollback).
  prisma.$transaction = vi.fn(async (fn: (tx: any) => Promise<unknown>) => {
    const snapshot = db.drops.map((d) => ({ ...d }));
    try {
      return await fn(prisma);
    } catch (err) {
      db.drops = snapshot;
      throw err;
    }
  });
  return { prisma };
});

import {
  allocateCollectible,
  getDropStatus,
  getUserCollectibles,
  grantSignupCollectibles,
} from "@/lib/collectibles";

function founders(overrides: Partial<DropRow> = {}): DropRow {
  return { id: "founders", maxSupply: 100, issuedCount: 0, active: true, autoGrantOnSignup: true, ...overrides };
}

beforeEach(() => {
  db.drops = [founders()];
  db.rows = [];
  db.failCreate = null;
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("allocateCollectible", () => {
  it("delar ut löpnummer i ordning", async () => {
    expect(await allocateCollectible("u1", "founders")).toEqual({ status: "granted", serial: 1 });
    expect(await allocateCollectible("u2", "founders")).toEqual({ status: "granted", serial: 2 });
    expect(db.rows.map((r) => r.source)).toEqual(["AUTO_EARLY_USER", "AUTO_EARLY_USER"]);
  });

  it("är idempotent per användare", async () => {
    await allocateCollectible("u1", "founders");
    expect(await allocateCollectible("u1", "founders")).toEqual({ status: "already_owned", serial: 1 });
    expect(db.drops[0].issuedCount).toBe(1);
  });

  it("delar aldrig ut fler än maxSupply", async () => {
    db.drops = [founders({ maxSupply: 3 })];
    for (const u of ["a", "b", "c"]) expect((await allocateCollectible(u, "founders")).status).toBe("granted");
    expect(await allocateCollectible("d", "founders")).toEqual({ status: "sold_out" });
    expect(db.rows).toHaveLength(3);
  });

  it("återanvänder inte löpnummer när ett konto raderats", async () => {
    await allocateCollectible("u1", "founders");
    await allocateCollectible("u2", "founders");
    db.rows[0].userId = null; // onDelete: SetNull
    expect(await allocateCollectible("u3", "founders")).toEqual({ status: "granted", serial: 3 });
  });

  it("ger inga dubbletter vid parallella anrop", async () => {
    db.drops = [founders({ maxSupply: 10 })];
    const users = Array.from({ length: 15 }, (_, i) => `u${i}`);
    const results = await Promise.all(users.map((u) => allocateCollectible(u, "founders")));
    const serials = results.flatMap((r) => (r.status === "granted" ? [r.serial] : []));
    expect(serials.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(results.filter((r) => r.status === "sold_out")).toHaveLength(5);
  });

  it("hoppar förbi ett nummer som redan är upptaget (räknaren ur fas)", async () => {
    db.rows.push({ userId: "manual", dropId: "founders", serial: 1, source: "ADMIN" });
    expect(await allocateCollectible("u1", "founders")).toEqual({ status: "granted", serial: 2 });
  });

  it("svarar unavailable för inaktivt, okänt eller icke-auto drop", async () => {
    db.drops = [founders({ active: false })];
    expect(await allocateCollectible("u1", "founders")).toEqual({ status: "unavailable" });
    expect(await allocateCollectible("u1", "missing")).toEqual({ status: "unavailable" });
    db.drops = [founders({ autoGrantOnSignup: false })];
    expect(await allocateCollectible("u1", "founders")).toEqual({ status: "unavailable" });
    // Admin-källan kräver inte autoGrantOnSignup.
    expect(await allocateCollectible("u1", "founders", { source: "ADMIN" })).toEqual({ status: "granted", serial: 1 });
  });

  it("rullar tillbaka räknaren om raden inte kan skapas", async () => {
    db.failCreate = new Error("db nere");
    await expect(allocateCollectible("u1", "founders")).rejects.toThrow("db nere");
    expect(db.drops[0].issuedCount).toBe(0);
  });
});

describe("grantSignupCollectibles", () => {
  it("delar ut alla öppna auto-drops", async () => {
    await grantSignupCollectibles("u1");
    expect(db.rows).toEqual([{ userId: "u1", dropId: "founders", serial: 1, source: "AUTO_EARLY_USER" }]);
  });

  it("kastar aldrig — även när databasen fallerar", async () => {
    db.failCreate = new Error("boom");
    await expect(grantSignupCollectibles("u1")).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("gör inget när droppet är slut", async () => {
    db.drops = [founders({ maxSupply: 1, issuedCount: 1 })];
    await grantSignupCollectibles("u9");
    expect(db.rows).toHaveLength(0);
  });
});

describe("läsning", () => {
  it("getUserCollectibles och getDropStatus", async () => {
    await allocateCollectible("u1", "founders");
    expect(await getUserCollectibles("u1")).toEqual([{ dropId: "founders", serial: 1, maxSupply: 100 }]);
    expect(await getDropStatus("founders")).toMatchObject({ issued: 1, remaining: 99, soldOut: false });
    expect(await getDropStatus("nope")).toBeNull();
  });
});
