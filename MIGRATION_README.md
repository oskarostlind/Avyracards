# Migrering: profilversionering + organisationsfält

Branch: `feat/db-versioning-och-org`. **Inte mergad till main** — och den ska
inte merge:as innan migreringen är körd mot produktionsdatabasen.

## Varför den ligger på en branch

`npm run build` kör bara `next build`, inte `prisma migrate deploy`. Prisma
listar alla kolumner i sina SELECT:ar, så om schemat innehåller en kolumn som
databasen saknar går varje `prisma.user.findUnique()` i produktion sönder med
"column does not exist". Ordningen måste därför vara: **migrera först, merga
sedan.**

## Vad migreringen gör (allt additivt, inget datatapp)

- `User.profileVersion` — INTEGER NOT NULL DEFAULT 1
- `User.organizationId` — TEXT NULL
- `Order.organizationId` — TEXT NULL
- Ny tabell `ProfileRevision` (ögonblicksbild före varje profiländring,
  raderas med användaren via ON DELETE CASCADE)

Inga kolumner tas bort, inga typer ändras, inga rader rörs. Migreringen är
säker att köra medan sajten är i drift.

## Kör så här

```bash
git fetch origin && git checkout feat/db-versioning-och-org
DATABASE_URL="<din Neon-connection-string, unpooled/direct>" npx prisma migrate deploy
```

Använd den **direkta** (unpooled) Neon-strängen, inte pooler-varianten —
DDL via PgBouncer i transaction mode kan bråka.

Verifiera:

```bash
DATABASE_URL="..." npx prisma migrate status
```

När den säger "Database schema is up to date": merga branchen till main.

## Sen då?

Kolumnerna finns men används inte av någon kod ännu — det är avsiktligt, så att
migreringen kan köras utan tidspress. Nästa session kopplar in
`ProfileRevision` i `PATCH /api/profile` (spara ögonblicksbild + öka
`profileVersion`) och lägger en ångra-knapp i inställningarna.
