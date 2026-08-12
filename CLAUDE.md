# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

AvyraCards (package name `socialcard-nextjs`) is a Next.js 14 (App Router) digital business-card / link-in-bio platform. Users get a public profile (`/u/[username]`) with either a **SOCIAL** or **BUSINESS** profile mode, customizable themes, and links. Physical NFC cards can be ordered, shipped, and claimed to a profile via `/c/[cardCode]`. The web app is also wrapped natively for iOS via Capacitor, so some code paths branch on whether they're running inside the native app.

Code comments and some UI copy are in Swedish; several files retain the "original code" comments explaining historical fixes — read them, they often explain non-obvious workarounds rather than restating the code.

## Commands

```bash
npm run dev             # start Next.js dev server
npm run build            # production build
npm run lint              # next lint
npm run postinstall       # prisma generate + patch Capacitor SPM plugins (runs automatically after install)

# Tests (Vitest)
npx vitest run                        # run all tests once
npx vitest                            # watch mode
npx vitest run src/utils/__tests__/theme.test.ts   # run a single test file

# Prisma
npx prisma generate
npx prisma migrate dev --name <name>
npx prisma db seed        # runs prisma/seed.ts

# iOS build number (see .cursor/skills/bump-ios-build/SKILL.md)
npm run ios:bump          # bump CURRENT_PROJECT_VERSION before a TestFlight/App Store upload
npm run ios:release       # bump + `npx cap sync ios`
```

There is no test script wired into `package.json` — invoke `vitest` directly. Only one test file exists today (`src/utils/__tests__/theme.test.ts`); tests must live under `src/**/*.test.{ts,tsx}` per `vitest.config.ts`.

`next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` to avoid OOM on the CI build host (Appflow) — `npm run build` will NOT fail on type or lint errors. Run `npm run lint` and `tsc --noEmit` yourself to actually catch problems before committing.

## Architecture

### Auth
NextAuth v5 (`src/auth.ts`) with a single Credentials provider that branches on which fields are present in the submitted credentials, handling three very different login flows through one `authorize()`:
1. Apple native login (`appleLoginToken`, verified via `@/lib/apple-auth`)
2. Admin impersonation (`impersonateId` + `adminSecret` checked against `NEXTAUTH_SECRET`)
3. Normal email/password (`bcryptjs` via `@/lib/password`)

Session strategy is JWT; `role` and `username` are threaded through the `jwt`/`session` callbacks and exposed on `session.user`. Route protection is centralized in `src/middleware.ts`, not in individual pages/handlers: it redirects unauthenticated users away from `/dashboard*`/`/profile*`, gates `/admin*` on `role === "ADMIN"`, and validates `callbackUrl` (same-origin only) to prevent open redirects.

### Profile modes (SOCIAL vs BUSINESS)
`User.profileMode` (Prisma enum `ProfileMode`) drives which set of profile fields, theme settings (`themeSettings` vs `businessThemeSettings`), and `Link`s (each `Link.mode`) are shown. `src/lib/profile-mapper.ts` (`getProfileData`) is the single place that turns a raw `User` + mode into the `MappedProfileData` a profile page renders — actions (phone/email/website/booking/vcard), filtered/sorted links, and theme-driven flags like `showSaveContact`. When adding a business- or social-only field, wire it through this mapper rather than branching in components.

### Theme engine
`src/types/theme.ts` defines `CustomThemeSettings` (background, colors, button style/variant, avatar frame, font) plus `defaultSettings`, merged with the user's saved JSON (`themeSettings`/`businessThemeSettings`) wherever a theme is read. `src/data/theme-templates-{social,business}.ts` hold preset `ThemeTemplate`s (some `isPremium`), edited via `src/components/themes/*` (per-section tabs: background/buttons/profile/templates) and persisted via `POST /api/themes/save`. `src/utils/theme.ts` is a separate, simpler token/preset lookup (`getTheme`/`themes`) used elsewhere — don't confuse it with `CustomThemeSettings`.

### Physical cards
`Card` (Prisma model) represents a physical NFC card tied to an `Order`/`OrderItem`. Lifecycle: `UNCLAIMED → CLAIMED` (or `DISABLED`/`LOST`). Tapping a card hits `/c/[cardCode]` (`src/app/c/[cardCode]/page.tsx`), which looks up the card and redirects: claimed → `/u/[username]`, disabled/lost → an error view, unclaimed → `/activate?code=...&token=...`. Claiming happens via `POST /api/cards/claim`, which requires an authenticated session and validates `claimToken` before assigning `assignedUserId`.

### Commerce
Stripe (`src/lib/stripe.ts`) handles premium subscription checkout and physical card orders (`Product`/`ProductVariant`/`OrderItem`/`Discount` models form a small PIM). `STRIPE_SECRET_KEY` has a placeholder fallback so the app doesn't crash at build/startup without env vars — real payment calls fail controlled instead. Order state machine: `PENDING → PAID/FAILED/SHIPPED`, driven by `/api/webhooks/stripe`. iOS also supports native in-app purchases (`AppleIapTransaction` model, `@capgo/native-purchases`) as an alternate premium path, gated by `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS`.

### Wallet passes
`/api/wallet/apple` and `/api/wallet/google` generate Apple Wallet (`passkit-generator`) and Google Wallet passes for a user's card, using the `APPLE_*`/`GOOGLE_WALLET_*` env vars for signing.

### Capacitor / iOS native shell
The Next.js app is deployed to the web (`avyracards.se`) and also loaded inside a native iOS shell via Capacitor (`capacitor.config.ts` points `server.url` at the live site — the iOS app is a WebView wrapper, not a static bundle). `src/utils/platform.ts`-style native/web branches and `NEXT_PUBLIC_IOS_*` env flags (`NEXT_PUBLIC_IOS_DEBUG`, `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS`) control iOS-only behavior (native purchases, push notifications via `@capacitor-community/fcm`, Apple Sign-In). `ios/` is a generated/committed native project — `scripts/patch-capacitor-plugins-spm.mjs` runs on `postinstall` to patch Swift Package Manager plugin references. **Always bump the iOS build number** (`npm run ios:bump`) before triggering a new TestFlight/Appflow build that includes code changes — see `.cursor/skills/bump-ios-build/SKILL.md`.

### Data access
Prisma (`src/lib/prisma.ts`) is the sole DB layer, Postgres via `DATABASE_URL`/`DIRECT_URL`. Per `README.md` guidelines, followed throughout the codebase:
- Avoid N+1 queries — use `findMany` with `include`/`select`/`_count` instead of looping DB calls.
- Reuse helpers in `src/lib` for recurring data shapes rather than writing ad-hoc queries in components.
- Always add `where`/`take` limits on lists that can grow unbounded (orders, analytics events).
- Check `prisma/schema.prisma` indexes before adding new heavy queries.

### Route structure
- `src/app/api/**` — REST-style route handlers (App Router `route.ts`), grouped by domain (`admin`, `auth`, `stripe`, `wallet`, `cards`, `links`, `upload`, `webhooks`, etc.)
- `src/app/admin/**` — admin UI, protected by middleware role check
- `src/app/(auth)/**`, `dashboard`, `profile`, `business`, `social` — authenticated user-facing pages
- `src/app/u/[username]`, `src/app/c/[cardCode]` — public profile and card-redirect pages
- `src/actions/**` — server actions (e.g. `onboarding.ts`, `admin.ts`, `reset-password.ts`)
- `src/components/**` — mirrors feature areas (`dashboard`, `admin`, `themes`, `public-profile`, `onboarding`, `profile`); `providers/` holds app-wide context providers (session, cookie consent)

### Path alias
`@/*` maps to `src/*` (both `tsconfig.json` and `vitest.config.ts`).
