# Migrering: UGC-säkerhet + Apple token revoke

**Måste köras mot produktionsdatabasen INNAN koden når `main`.**
`main` är Vercels produktionsbranch — mergas koden först kraschar varje
Prisma-SELECT mot `User` på kolumner som inte finns än.

## Ordning

```bash
# 1. Kör migreringen mot Neon med den DIREKTA (unpooled) anslutningssträngen
DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy

# 2. Verifiera
npx prisma migrate status

# 3. Först därefter: merge till main
```

## Innehåll

Helt additivt — inga `DROP`, inga typändringar, inga dataändringar.

- `User.appleRefreshToken` (TEXT, null) — behövs för Apples `auth/revoke` vid
  kontoradering (TN3194 / guideline 5.1.1(v)).
- `User.isSuspended` (BOOL, default false), `User.suspendedAt`,
  `User.suspendedReason` — moderationens möjlighet att ta bort en profil
  publikt utan att radera kontot (guideline 1.2).
- `ProfileReport` — rapporter om användarinnehåll. `reporterUserId` är nullbar
  eftersom utloggade besökare måste kunna rapportera; `ON DELETE SET NULL` så
  att en raderad rapportörs ärenden finns kvar.
- `UserBlock` — blockeringar, unikt per (blockerare, blockerad).

## Rollback

```sql
DROP TABLE "UserBlock";
DROP TABLE "ProfileReport";
DROP TYPE "ReportStatus";
DROP TYPE "ReportReason";
ALTER TABLE "User"
  DROP COLUMN "appleRefreshToken",
  DROP COLUMN "isSuspended",
  DROP COLUMN "suspendedAt",
  DROP COLUMN "suspendedReason";
```
