-- Länkanpassning: egen färg per knapp (premium) + manuellt ikonval.
--
-- "icon" fanns redan i schemat sedan den första migrationen men användes
-- aldrig — den blir nu bäraren av den manuellt valda ikon-sluggen
-- (NULL = automatisk detektering ur URL:en, se src/lib/link-icons.ts).
--
-- "customColor" är nytt: hexfärg (#rrggbb) eller NULL för temats accentfärg.
-- Fältet är nullable och utan default, så befintliga rader påverkas inte och
-- migrationen kan köras utan nedtid.

-- Helt additiv: ingen DROP, inga typändringar, inga dataändringar.
-- Kör med `npx prisma migrate deploy` mot prod INNAN koden mergas till main.

-- AlterTable
ALTER TABLE "Link" ADD COLUMN "customColor" TEXT;
