# AvyraCards — Projektreferens

## Stack

| Lager | Teknik |
|-------|--------|
| Framework | Next.js 14 (App Router), React 18 |
| Databas | PostgreSQL via Prisma 5 |
| Auth | NextAuth v5 (`src/auth.ts`) |
| Styling | Tailwind CSS |
| Validering | Zod |
| Betalning | Stripe |
| Mobil | Capacitor 8 (iOS) |
| Deploy | Vercel |

## Katalogstruktur

```
src/
├── app/                    # App Router — sidor och API-routes
│   ├── api/                # REST-endpoints
│   ├── u/[username]/       # Publika profiler
│   ├── c/[cardCode]/       # NFC-kort → aktivering
│   ├── dashboard/          # Inloggad användare
│   └── admin/              # Adminpanel
├── components/
│   ├── dashboard/          # Dashboard-UI
│   ├── public-profile/     # SocialProfile, BusinessProfile
│   └── themes/             # Temaredigerare
├── lib/                    # Serverlogik (prisma, stripe, email, m.m.)
├── types/                  # Delade TypeScript-typer
└── utils/                  # Hjälpfunktioner (theme, platform)
prisma/
├── schema.prisma
└── seed.ts
```

## Viktiga modeller (Prisma)

- **User** — profil, premium, business/social-läge, tema, redirect
- **Link** — användarens länkar (SOCIAL/BUSINESS mode)
- **Card** — fysiskt NFC-kort (`cardCode`, `claimToken`)
- **AnalyticsEvent** — profilvisningar och klick
- **Order** — beställningar av fysiska kort

## API-mönster

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

- Använd `select` i Prisma-queries för att begränsa fält
- Rate limiting: `src/lib/rate-limit.ts`
- Publika endpoints: validera input, returnera strukturerade JSON-fel

## Profiler

- **SOCIAL** — `SocialProfile`, länkar med `mode: SOCIAL`
- **BUSINESS** — `BusinessProfile`, business-fält och `mode: BUSINESS`
- Mappning: `getProfileData()` i `src/lib/profile-mapper.ts`
- Redirect: `redirectEnabled` + `redirectLinkId` på User

## NFC-flöde

1. Användare blippar kort → `/c/[cardCode]`
2. Omdirigering till `/activate?code=...&token=...`
3. Registrering/koppling via `src/app/api/cards/claim/route.ts`

## ESLint

`.eslintrc.json` — `@typescript-eslint/no-unused-vars` är `error`. Oanvända variabler måste tas bort eller prefixas med `_`.

## Kommandon

| Kommando | Syfte |
|----------|-------|
| `npm run dev` | Lokal utveckling |
| `npm run build` | Produktionsbygg (samma som Vercel) |
| `npm run lint` | ESLint-kontroll |
| `npx prisma format` | Formatera schema |
| `npx prisma migrate dev` | Skapa och applicera migration |
| `npx prisma generate` | Generera Prisma Client |
