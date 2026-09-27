-- Limited edition / samlarobjekt — första droppet "Founders".
--
-- Helt additiv: nya typer/tabeller, inga ändringar av befintliga kolumner.
-- Idempotent: kan köras om utan att dela ut nummer två gånger.
-- MÅSTE köras med `prisma migrate deploy` mot prod FÖRE merge till main —
-- koden läser Drop/UserCollectible vid registrering och på publika profiler.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CollectibleSource" AS ENUM ('AUTO_EARLY_USER', 'ADMIN', 'PURCHASE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Drop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxSupply" INTEGER NOT NULL,
    "issuedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autoGrantOnSignup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Drop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserCollectible" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "dropId" TEXT NOT NULL,
    "serial" INTEGER NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "CollectibleSource" NOT NULL,

    CONSTRAINT "UserCollectible_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserCollectible_userId_idx" ON "UserCollectible"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserCollectible_dropId_serial_key" ON "UserCollectible"("dropId", "serial");
CREATE UNIQUE INDEX IF NOT EXISTS "UserCollectible_userId_dropId_key" ON "UserCollectible"("userId", "dropId");

-- AddForeignKey (SetNull: löpnumret ligger kvar om kontot raderas och återanvänds aldrig)
DO $$ BEGIN
  ALTER TABLE "UserCollectible" ADD CONSTRAINT "UserCollectible_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "UserCollectible" ADD CONSTRAINT "UserCollectible_dropId_fkey"
    FOREIGN KEY ("dropId") REFERENCES "Drop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Founders: de 100 första kontona. Öppet tills 100 är utdelade, sedan
-- stängt för alltid (issuedCount minskas aldrig).
INSERT INTO "Drop" ("id", "name", "maxSupply", "issuedCount", "startsAt", "active", "autoGrantOnSignup")
VALUES ('founders', 'Founders', 100, 0, '2025-01-01 00:00:00', true, true)
ON CONFLICT ("id") DO NOTHING;

-- Backfill: de 100 äldsta befintliga kontona får #001… i createdAt-ordning
-- (id som tie-breaker så att ordningen är deterministisk). Hoppar över konton
-- som redan har ett Founders-exemplar och fortsätter numreringen efter det
-- högsta redan utdelade numret, så att en omkörning aldrig krockar.
WITH already AS (
  SELECT COALESCE(MAX("serial"), 0) AS max_serial, COUNT(*) AS n
  FROM "UserCollectible" WHERE "dropId" = 'founders'
),
candidates AS (
  SELECT u."id", ROW_NUMBER() OVER (ORDER BY u."createdAt" ASC, u."id" ASC) AS rn
  FROM "User" u
  WHERE NOT EXISTS (
    SELECT 1 FROM "UserCollectible" c WHERE c."dropId" = 'founders' AND c."userId" = u."id"
  )
)
INSERT INTO "UserCollectible" ("id", "userId", "dropId", "serial", "grantedAt", "source")
SELECT
  'fdr_' || md5(random()::text || clock_timestamp()::text || c."id"),
  c."id",
  'founders',
  (a.max_serial + c.rn)::int,
  CURRENT_TIMESTAMP,
  'AUTO_EARLY_USER'
FROM candidates c CROSS JOIN already a
WHERE a.max_serial + c.rn <= 100
ORDER BY c.rn
ON CONFLICT DO NOTHING;

-- Räknaren = högsta utdelade numret (aldrig lägre än den redan var).
UPDATE "Drop" d
SET "issuedCount" = GREATEST(
  d."issuedCount",
  (SELECT COALESCE(MAX("serial"), 0) FROM "UserCollectible" WHERE "dropId" = d."id")
)
WHERE d."id" = 'founders';
