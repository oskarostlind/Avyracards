-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "profileVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "ProfileRevision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileRevision_userId_createdAt_idx" ON "ProfileRevision"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileRevision_userId_version_key" ON "ProfileRevision"("userId", "version");

-- AddForeignKey
ALTER TABLE "ProfileRevision" ADD CONSTRAINT "ProfileRevision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

