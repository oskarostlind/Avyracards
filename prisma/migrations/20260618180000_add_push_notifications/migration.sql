-- AlterTable: push-notiser (iOS app)
-- Idempotent: kolumnerna kan redan finnas i produktion (tidigare db push)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushToken" TEXT,
ADD COLUMN IF NOT EXISTS "notifyOnProfileView" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifyOnLinkClick" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "notifyOnContactSave" BOOLEAN NOT NULL DEFAULT true;
