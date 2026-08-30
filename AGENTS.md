# AGENTS.md

## Cursor Cloud specific instructions

This is a **Next.js 14 (App Router)** app ("AvyraCards" / SocialCard — a digital
business-card / link-in-bio product, UI in Swedish) backed by **Prisma +
PostgreSQL**, with **NextAuth (credentials)**, **Stripe**, and optional
wallet/email integrations.

The startup update script only runs `npm install` (which runs
`prisma generate` via the `postinstall` hook). Everything below — PostgreSQL,
the `.env` file, schema sync, and the dev server — is part of the VM snapshot or
must be started per session; it is intentionally NOT in the update script.

### Services

| Service          | Purpose                          | How to run                              |
| ---------------- | -------------------------------- | --------------------------------------- |
| PostgreSQL 16    | Primary database (required)      | `sudo pg_ctlcluster 16 main start`      |
| Next.js dev      | The web app (required)           | `npm run dev` (http://localhost:3000)   |
| maildev          | Local SMTP catcher (dev only)    | see "Email / registration" below        |

### Database (required, non-obvious)

- Local dev DB role/name used by `.env`: user `socialcard` / password
  `socialcard` / database `socialcard` on `localhost:5432`.
- **Do NOT rely on `prisma migrate deploy` alone.** The committed migrations in
  `prisma/migrations` only create the `User` and `Link` tables; the rest of the
  schema (`Order`, `Product`, `Card`, etc.) is managed via `prisma db push`.
  After a fresh DB, sync the full schema with:
  `npx prisma db push --accept-data-loss` then `npx prisma db seed`.
- `prisma db seed` runs `prisma/seed.ts` (creates the "premium-bundle" product).

### Environment variables

- Prisma CLI reads `.env` (not `.env.local`), so all dev vars live in `.env`
  (gitignored). Required keys: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`
  (+ `AUTH_SECRET` mirror for next-auth v5 beta), `NEXTAUTH_URL`,
  `NEXT_PUBLIC_BASE_URL=http://localhost:3000`.
- Stripe, Vercel Blob, Unsplash, Google/Apple wallet, and SMTP keys are all
  optional — the app boots without them and only fails when those specific
  features are exercised (`src/lib/stripe.ts` uses a placeholder key).

### Email / registration (non-obvious gotcha)

- `POST /api/auth/register` **sends a verification email and rolls back the new
  user if sending fails**, so registration needs a working SMTP endpoint even in
  dev. Run a local mail catcher and point SMTP at it:
  `npx maildev --smtp 1025 --web 1080 --incoming-user testuser --incoming-pass testpass`
  then set in `.env`: `SMTP_HOST=localhost`, `SMTP_PORT=1025`,
  `SMTP_SECURE=false`, `SMTP_USER=testuser`, `SMTP_PASS=testpass`,
  `SMTP_FROM="AvyraCards <noreply@local.test>"`. Captured mail UI:
  http://localhost:1080. Restart `npm run dev` after editing `.env`.
- Login does **not** require email verification ("lazy verification" — the check
  is commented out in `src/auth.ts`), so after registering you can log in
  immediately.

### Lint / test / build

- Lint: `npm run lint` (`next lint`).
- Tests: `npx vitest run` (config in `vitest.config.ts`, picks up
  `src/**/*.test.ts`).
- Build: `npm run build`. Note `next.config.mjs` sets
  `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` to save memory,
  so build will NOT catch type/lint errors — run `npm run lint` separately.
