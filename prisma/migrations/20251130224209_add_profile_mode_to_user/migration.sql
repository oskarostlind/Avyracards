-- CreateEnum
CREATE TYPE "ProfileMode" AS ENUM ('SOCIAL', 'BUSINESS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileMode" "ProfileMode" NOT NULL DEFAULT 'SOCIAL';
