# Exempel

## Exempel 1: Ny funktion med oklar spec

**User:** "Kan du lägga till en funktion för att hämta användarstatistik?"

**Agent:**

1. Frågar om oklarheter (t.ex. vilka specifika datapunkter som ska hämtas, tidsintervall, autentisering).
2. Läser befintlig `src/app/api/analytics/route.ts` och dashboard-komponenter.
3. Genererar komplett fil med strikt typade interfaces — inga `any`.
4. Kör `node .cursor/skills/avyracards-fullstack/scripts/validate.mjs`.
5. Svarar enligt output-format.

**Commit-förslag:**

```
feat(api): implement strict typed endpoint for user statistics
```

---

## Exempel 2: Prisma-schemaändring

**User:** "Lägg till ett fält `lastLoginAt` på User."

**Agent:**

1. Uppdaterar `prisma/schema.prisma` med `DateTime?`.
2. Kör `node .cursor/skills/avyracards-fullstack/scripts/validate.mjs --prisma`.
3. Föreslår migration: `npx prisma migrate dev --name add_user_last_login_at`.
4. Uppdaterar berörda queries och typer.
5. Levererar kompletta filer.

**Commit-förslag:**

```
feat(db): add lastLoginAt timestamp to User model
```

---

## Exempel 3: Publik profil-komponent

**User:** "Uppdatera business-profilen så att telefonnummer visas som klickbar länk."

**Agent:**

1. Läser `src/components/public-profile/business-profile.tsx` och `src/lib/profile-mapper.ts`.
2. Definierar/uppdaterar typer för profildata utan `any`.
3. Implementerar `tel:`-länk med tillgänglighet (aria-label).
4. Kör lint-validering.
5. Levererar hela komponentfilen.

**Commit-förslag:**

```
feat(profile): make business phone number a clickable tel link
```
