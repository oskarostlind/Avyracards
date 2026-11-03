-- Google Play Billing (Android-appen): Premium-prenumerationer.
--
-- Helt additiv: nytt enum-värde + ny tabell, inga ändringar av befintliga
-- kolumner. Idempotent: kan köras om. Kör med `prisma migrate deploy` mot
-- prod FÖRE merge — verify-routen och den lata förnyelsesynken läser tabellen.

-- AlterEnum
ALTER TYPE "PremiumSource" ADD VALUE IF NOT EXISTS 'GOOGLE_PLAY';

-- CreateTable
CREATE TABLE IF NOT EXISTS "GooglePlayPurchase" (
    "id" TEXT NOT NULL,
    "purchaseToken" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "basePlanId" TEXT,
    "orderId" TEXT,
    "state" TEXT NOT NULL,
    "testPurchase" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GooglePlayPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "GooglePlayPurchase_purchaseToken_key" ON "GooglePlayPurchase"("purchaseToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GooglePlayPurchase_userId_idx" ON "GooglePlayPurchase"("userId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "GooglePlayPurchase" ADD CONSTRAINT "GooglePlayPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
