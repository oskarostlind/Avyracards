---
name: avyracards-fullstack
description: >-
  Handles fullstack development and refactoring for the AvyraCards platform
  (Next.js, Prisma, Vercel) with strict TypeScript and production-ready
  delivery. Use when creating or updating React components or pages, modifying
  prisma/schema.prisma or database queries, debugging Next.js API routes or
  Vercel build errors, or working on public profiles, NFC card flows, Apple/Google
  Wallet, or dashboard features.
---

# AvyraCards Fullstack

## Syfte

Hantera all fullstack-utveckling och refaktorering för AvyraCards-plattformen (Next.js, Prisma). Säkerställa att all ny kod håller högsta kvalitet, är strikt typad och är redo för produktion utan att lämna teknisk skuld.

## Triggers

Tillämpa denna skill när användaren:

- Ber om att skapa eller uppdatera React-komponenter eller sidor
- Modifierar `prisma/schema.prisma` eller skriver databasfrågor
- Felsöker Next.js API-routes eller Vercel-byggfel
- Diskuterar publika profilsidor eller NFC-funktionalitet

## Kodstandard (strikt)

- **Tech stack:** Next.js 14 (App Router), Prisma 5, PostgreSQL, Vercel, Capacitor (iOS)
- Följ alltid uppsatta ESLint-regler. Kör `npm run lint` innan kod presenteras.
- Du får **ALDRIG** använda `any` i TypeScript. Använd `unknown`, generiska typer, Zod-scheman eller explicita interfaces.
- Se till att absolut inga variabler lämnas oanvända. Prefix oavsiktliga parametrar med `_` om ESLint kräver det.
- Undvik `@ts-ignore` och `@ts-expect-error` i ny kod. Fixa typproblemet vid källan.
- Använd befintliga mönster: `@/lib/prisma`, `@/lib/data-access`, `getProfileData`, Zod-validering i API-routes.

## Arbetsmetodik

Gör inga antaganden. Om en instruktion, ett flöde eller en design är oklar, måste du stanna upp och ställa en klargörande fråga innan du genererar koden.

**Leverans:** Ge utförliga svar och generera alltid kompletta filer, inte bara lösryckta kodsnuttar eller diffar, så att koden fungerar direkt vid inklistring.

## Arbetsflöde

```
Task Progress:
- [ ] Klargör oklarheter med användaren (om nödvändigt)
- [ ] Läs berörda filer och matcha befintliga konventioner
- [ ] Implementera ändringar med strikt typning
- [ ] Kör validering (se nedan)
- [ ] Presentera svar enligt output-format
```

### Validering före leverans

Kör från projektroten:

```bash
node .cursor/skills/avyracards-fullstack/scripts/validate.mjs
```

Vid ändringar i `prisma/schema.prisma`, kör även:

```bash
node .cursor/skills/avyracards-fullstack/scripts/validate.mjs --prisma
```

Eller manuellt:

```bash
npm run lint
npx prisma format   # endast vid schema-ändringar
```

Åtgärda alla lint- och typfel innan svaret skickas. Presentera inte kod som inte passerar lint.

### Prisma-ändringar

1. Uppdatera `prisma/schema.prisma`
2. Kör `npx prisma format`
3. Skapa migration: `npx prisma migrate dev --name beskrivande_namn`
4. Kör `npx prisma generate` om klienten behöver uppdateras
5. Uppdatera typer och queries i `src/` konsekvent

Se [reference.md](reference.md) för projektstruktur och viktiga sökvägar.

## Output-format

Varje svar ska följa denna struktur:

### 1. Kort förklaring
Sammanfatta vad som gjorts och varför.

### 2. Kompletta kodblock
Visa hela innehållet för varje berörd fil — inte bara diffar eller utdrag.

### 3. Commit-förslag
Avsluta med ett tydligt, strukturerat commit-meddelande, t.ex.:

```
feat(api): implement strict typed endpoint for user statistics
```

Använd prefix: `feat`, `fix`, `refactor`, `chore`, `docs`.

## Domänreferens (snabb)

| Område | Sökväg |
|--------|--------|
| Publika profiler | `src/app/u/[username]/page.tsx` |
| NFC-kortaktivering | `src/app/c/[cardCode]/page.tsx`, `src/app/activate/` |
| Profil-API | `src/app/api/public/[username]/route.ts` |
| Wallet | `src/app/api/wallet/apple/`, `src/app/api/wallet/google/` |
| Dashboard | `src/components/dashboard/`, `src/app/dashboard/` |
| Prisma | `prisma/schema.prisma`, `src/lib/prisma.ts` |
| Auth | `src/auth.ts`, `src/middleware.ts` |

Mer detaljer: [reference.md](reference.md). Exempel på interaktion: [examples.md](examples.md).

## Anti-mönster

- Introducera inte `any`, `// eslint-disable`, eller oanvända imports
- Lämna inte halvfärdiga TODO utan att nämna dem explicit
- Anta inte API-kontrakt, fältnamn eller UX-flöden — fråga först
- Skicka inte kodsnuttar när en hel fil behövs
