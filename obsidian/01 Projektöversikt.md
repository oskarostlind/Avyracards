---
skapad: 2026-08-10
---

# Projektöversikt

## Vad är AvyraCards?

Digital visitkorts-/link-in-bio-plattform. Varje användare får en publik profil på `/u/[användarnamn]` med två lägen: **SOCIAL** (privat) och **BUSINESS** (företag), med egna länkar, teman och fält per läge. Fysiska **NFC-kort** kan beställas, skickas och kopplas ("claimas") till en profil via `/c/[kortkod]`. Intäkter: premiumprenumeration + försäljning av fysiska kort (plast/metall).

- Webb: **avyracards.se** (Next.js 14, deployad via Vercel)
- iOS: **Capacitor-skal** som laddar live-sajten (`server.url` → avyracards.se) — appen är en WebView-wrapper med native-tillägg
- App-ID: `se.avyracards.app`, appnamn "AvyraCards"

## Teknisk stack

| Del | Teknik |
|---|---|
| Frontend/backend | Next.js 14 App Router, TypeScript, Tailwind |
| Databas | Postgres via Prisma |
| Auth | NextAuth v5 — e-post/lösenord, Apple native login, admin-impersonation |
| Betalning webb | Stripe (prenumeration + kortordrar, webhook-driven orderstatus) |
| Betalning iOS | Native IAP via `@capgo/native-purchases`, flagga `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS` |
| Wallet | Apple Wallet (`passkit-generator`) + Google Wallet |
| Push | FCM via `@capacitor-community/fcm` |
| iOS-byggen | Appflow (CI), TestFlight. `npm run ios:bump` före varje bygge! |
| E-post | Resend/Nodemailer |
| Tester | Vitest (endast 1 testfil idag) |

## Nyckelflöden

1. **Kortlivscykel:** `UNCLAIMED → CLAIMED` (eller `DISABLED`/`LOST`). Tap på kort → `/c/[cardCode]` → redirect till profil eller aktivering.
2. **Order:** `PENDING → PAID/FAILED → SHIPPED`, drivs av Stripe-webhook. Admin-vy för orderhantering + packsedlar. Kort beställs från nfctagshop.de.
3. **Profilmappning:** `src/lib/profile-mapper.ts` är enda stället som omvandlar User+läge → renderbar profildata.
4. **Temamotor:** `CustomThemeSettings` (JSON per användare, separat för social/business), preset-mallar varav vissa premium.

## Viktiga egenheter

- `next.config.mjs` har `ignoreBuildErrors` + `ignoreDuringBuilds` (OOM på Appflow) → **builden fångar INTE typ-/lintfel**. Kör `npm run lint` och `tsc --noEmit` manuellt.
- Kodkommentarer delvis på svenska; "original code"-kommentarer förklarar historiska workarounds.
- `ios/` är incheckad; `postinstall` patchar Capacitor SPM-plugins.
- **Bumpa alltid iOS-buildnummer** (`npm run ios:bump`) före nytt TestFlight/Appflow-bygge.
