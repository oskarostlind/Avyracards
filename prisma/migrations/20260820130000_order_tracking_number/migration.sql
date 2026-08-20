-- Spårningsnummer på order — sätts av admin vid "Markera som Skickad" och
-- inkluderas i leveransmailet till kunden.
-- Helt additiv: ingen DROP, inga typändringar, inga dataändringar.
-- Kör med `npx prisma migrate deploy` mot prod INNAN koden mergas till main.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;
