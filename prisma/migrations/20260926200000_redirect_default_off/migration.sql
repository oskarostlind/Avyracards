-- Direktlänk ska vara AV tills användaren själv väljer en länk.
-- Tidigare default(true) + fallback till första länken gjorde att alla nya
-- användares profiler skickade besökare direkt till första länken.
ALTER TABLE "User" ALTER COLUMN "redirectEnabled" SET DEFAULT false;

-- Datastädning: ingen vald länk = direktlänk av. Användare som aktivt valt
-- en länk (redirectLinkId satt) behåller sin inställning.
UPDATE "User" SET "redirectEnabled" = false
WHERE "redirectEnabled" = true AND "redirectLinkId" IS NULL;
