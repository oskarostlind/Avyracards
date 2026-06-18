-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "appleId" TEXT,
ADD COLUMN "appleEmail" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "stripePaymentIntentId" TEXT,
ADD COLUMN "checkoutSource" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_appleId_key" ON "User"("appleId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");

-- AlterEnum
ALTER TYPE "PremiumSource" ADD VALUE 'APPLE_IAP';

-- CreateTable
CREATE TABLE "AppleIapTransaction" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "environment" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppleIapTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppleIapTransaction_transactionId_key" ON "AppleIapTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "AppleIapTransaction_userId_idx" ON "AppleIapTransaction"("userId");

-- AddForeignKey
ALTER TABLE "AppleIapTransaction" ADD CONSTRAINT "AppleIapTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
