-- Unika besökare i statistiken (admin + framtida premium-statistik).
-- Helt additiv: ingen DROP, inga typändringar, inga dataändringar.
-- Kör med `npx prisma migrate deploy` mot prod INNAN koden mergas till main.

-- AlterTable
ALTER TABLE "AnalyticsEvent" ADD COLUMN "visitorHash" TEXT;

-- CreateIndex (plattformsövergripande tidsfrågor i admin-statistiken;
-- befintligt index börjar på profileOwnerId och hjälper inte där)
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
