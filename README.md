
```
SocialCard-Next.js
├─ .eslintrc.json
├─ next-env.d.ts
├─ next.config.mjs
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ postcss.config.mjs
├─ prisma
│  ├─ migrations
│  │  ├─ 20251120214444_add_email_verification
│  │  │  └─ migration.sql
│  │  ├─ 20251124212821_add_contact_fields
│  │  │  └─ migration.sql
│  │  ├─ 20251129001129_add_redirect_enabled
│  │  │  └─ migration.sql
│  │  ├─ 20251130224209_add_profile_mode_to_user
│  │  │  └─ migration.sql
│  │  ├─ 20251203203949_add_business_profile_fields
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  ├─ schema.prisma
│  └─ seed.ts
├─ public
│  ├─ ads.txt
│  ├─ default-profile.png
│  ├─ media
│  │  └─ socialcard-demo.mp4
│  └─ wallet
│     ├─ icon.png
│     └─ logo.png
├─ README.md
├─ src
│  ├─ actions
│  │  ├─ admin.ts
│  │  ├─ onboarding.ts
│  │  └─ reset-password.ts
│  ├─ app
│  │  ├─ (auth)
│  │  │  ├─ login
│  │  │  │  └─ page.tsx
│  │  │  └─ register
│  │  │     └─ page.tsx
│  │  ├─ activate
│  │  │  ├─ confirm
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ admin
│  │  │  ├─ orders
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  ├─ page.tsx
│  │  │  ├─ products
│  │  │  │  └─ page.tsx
│  │  │  └─ users
│  │  │     ├─ page.tsx
│  │  │     └─ [id]
│  │  │        └─ page.tsx
│  │  ├─ api
│  │  │  ├─ account
│  │  │  │  └─ route.ts
│  │  │  ├─ admin
│  │  │  │  ├─ discounts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ orders
│  │  │  │  │  └─ [id]
│  │  │  │  │     ├─ generate
│  │  │  │  │     │  └─ route.ts
│  │  │  │  │     └─ status
│  │  │  │  │        └─ route.ts
│  │  │  │  └─ products
│  │  │  │     └─ route.ts
│  │  │  ├─ analytics
│  │  │  │  └─ route.ts
│  │  │  ├─ auth
│  │  │  │  ├─ register
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ resend-verification
│  │  │  │     └─ route.ts
│  │  │  ├─ cards
│  │  │  │  └─ claim
│  │  │  │     └─ route.ts
│  │  │  ├─ links
│  │  │  │  ├─ reorder
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ [id]
│  │  │  │     └─ route.ts
│  │  │  ├─ me
│  │  │  │  └─ route.ts
│  │  │  ├─ profile
│  │  │  │  └─ route.ts
│  │  │  ├─ public
│  │  │  │  ├─ avatar
│  │  │  │  │  └─ [username]
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ [username]
│  │  │  │     └─ route.ts
│  │  │  ├─ settings
│  │  │  │  └─ route.ts
│  │  │  ├─ stripe
│  │  │  │  ├─ checkout
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ portal
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ verify-session
│  │  │  │     └─ route.ts
│  │  │  ├─ themes
│  │  │  │  └─ save
│  │  │  │     └─ route.ts
│  │  │  ├─ unsplash
│  │  │  │  └─ route.ts
│  │  │  ├─ upload
│  │  │  │  ├─ profile-image
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ wallet
│  │  │  │  ├─ apple
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ google
│  │  │  │     └─ route.ts
│  │  │  └─ webhooks
│  │  │     └─ stripe
│  │  │        └─ route.ts
│  │  ├─ business
│  │  │  └─ page.tsx
│  │  ├─ c
│  │  │  └─ [cardCode]
│  │  │     └─ page.tsx
│  │  ├─ checkout
│  │  │  └─ premium
│  │  │     └─ page.tsx
│  │  ├─ contact
│  │  │  └─ page.tsx
│  │  ├─ dashboard
│  │  │  ├─ analytics
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ forgot-password
│  │  │  └─ page.tsx
│  │  ├─ get-started
│  │  │  └─ page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ not-found.tsx
│  │  ├─ order
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ privacy
│  │  │  └─ page.tsx
│  │  ├─ profile
│  │  │  ├─ settings
│  │  │  │  └─ page.tsx
│  │  │  └─ themes
│  │  │     └─ page.tsx
│  │  ├─ register
│  │  │  └─ activate
│  │  │     └─ page.tsx
│  │  ├─ reset-password
│  │  │  └─ page.tsx
│  │  ├─ social
│  │  │  └─ page.tsx
│  │  ├─ terms
│  │  │  └─ page.tsx
│  │  ├─ u
│  │  │  └─ [username]
│  │  │     └─ page.tsx
│  │  ├─ verify
│  │  │  └─ route.ts
│  │  ├─ verify-resend
│  │  │  └─ page.tsx
│  │  └─ verify-sent
│  │     └─ page.tsx
│  ├─ auth.ts
│  ├─ components
│  │  ├─ admin
│  │  │  ├─ order-actions.tsx
│  │  │  ├─ packing-slip.tsx
│  │  │  └─ product-manager.tsx
│  │  ├─ ads
│  │  │  └─ google-adsense.tsx
│  │  ├─ analytics
│  │  │  └─ trackers.tsx
│  │  ├─ auth
│  │  │  ├─ login-form.tsx
│  │  │  └─ register-form.tsx
│  │  ├─ avatar-uploader.tsx
│  │  ├─ card-preview-3d.tsx
│  │  ├─ cookie-banner.tsx
│  │  ├─ dashboard
│  │  │  ├─ accordion.tsx
│  │  │  ├─ add-link-form.tsx
│  │  │  ├─ analytics-view.tsx
│  │  │  ├─ business
│  │  │  │  ├─ business-profile-form.tsx
│  │  │  │  └─ business-view.tsx
│  │  │  ├─ dashboard-shell.tsx
│  │  │  ├─ globe.tsx
│  │  │  ├─ links-workspace.tsx
│  │  │  ├─ order-card-widget.tsx
│  │  │  ├─ profile-preview-modal.tsx
│  │  │  ├─ public-profile-card.tsx
│  │  │  └─ social
│  │  │     ├─ social-profile-form.tsx
│  │  │     └─ social-view.tsx
│  │  ├─ file-upload-button.tsx
│  │  ├─ footer.tsx
│  │  ├─ get-started-view.tsx
│  │  ├─ icons
│  │  │  └─ social-icons.tsx
│  │  ├─ link-card.tsx
│  │  ├─ links-list.tsx
│  │  ├─ live-profile-demo.tsx
│  │  ├─ navbar-client.tsx
│  │  ├─ navbar.tsx
│  │  ├─ onboarding
│  │  │  ├─ onboarding-modal.tsx
│  │  │  └─ slides
│  │  │     ├─ dashboard-visual.tsx
│  │  │     ├─ hardware-slide.tsx
│  │  │     ├─ stats-visual.tsx
│  │  │     ├─ themes-visual.tsx
│  │  │     └─ visuals.tsx
│  │  ├─ order-view.tsx
│  │  ├─ premium-checkout-form.tsx
│  │  ├─ profile
│  │  │  ├─ account-form.tsx
│  │  │  ├─ billing-view.tsx
│  │  │  ├─ cards-view.tsx
│  │  │  ├─ profile-settings-form.tsx
│  │  │  └─ settings-tabs.tsx
│  │  ├─ profile-card.tsx
│  │  ├─ profile-preview.tsx
│  │  ├─ providers
│  │  │  ├─ consent-manager.tsx
│  │  │  └─ session-provider.tsx
│  │  ├─ public-profile
│  │  │  ├─ business-profile.tsx
│  │  │  └─ social-profile.tsx
│  │  ├─ sign-in-button.tsx
│  │  ├─ sign-out-button.tsx
│  │  ├─ theme-selector.tsx
│  │  └─ themes
│  │     ├─ image-uploader.tsx
│  │     ├─ media-manager.tsx
│  │     ├─ tabs
│  │     │  ├─ background-tab.tsx
│  │     │  ├─ buttons-tab.tsx
│  │     │  ├─ profile-tab.tsx
│  │     │  └─ templates-tab.tsx
│  │     ├─ theme-controls.tsx
│  │     ├─ theme-editor.tsx
│  │     ├─ unsplash-picker.tsx
│  │     └─ upgrade-modal.tsx
│  ├─ data
│  │  ├─ theme-templates-business.ts
│  │  └─ theme-templates-social.ts
│  ├─ lib
│  │  ├─ constants.ts
│  │  ├─ crop-image.ts
│  │  ├─ email.ts
│  │  ├─ password.ts
│  │  ├─ prisma.ts
│  │  ├─ products.ts
│  │  ├─ profile-mapper.ts
│  │  ├─ session.ts
│  │  └─ stripe.ts
│  ├─ middleware.ts
│  ├─ types
│  │  ├─ next-auth.d.ts
│  │  └─ theme.ts
│  └─ utils
│     ├─ platform.ts
│     ├─ theme.ts
│     └─ __tests__
│        └─ theme.test.ts
├─ stripe.exe
├─ tailwind.config.js
├─ tsconfig.json
├─ tsconfig.tsbuildinfo
└─ vitest.config.ts

```

## Geodata för statistik (MaxMind GeoLite2)

Statistiken visar stad och land per besökare. Landskoden kommer från Vercels
`x-vercel-ip-country`-header, men stad (`x-vercel-ip-city`) saknas ofta. Tidigare
frågade vi ipapi.co som fallback — ett gratis-API med ~1000 anrop/dygn räknat per
käll-IP. I produktion är käll-IP:t Vercels utgående adress, delad av alla
funktioner, så kvoten tog slut nästan direkt och svaren blev 429. Felen
swallowades tyst, vilket är varför statistiken visade "Okänd plats, SE".

Nu slås staden i stället upp lokalt i MaxMinds GeoLite2-City-databas
(`src/lib/analytics/geo.ts`).

**Miljövariabler** (gratis MaxMind-konto krävs — https://www.maxmind.com/en/geolite2/signup):

| Variabel | Krävs | Beskrivning |
| --- | --- | --- |
| `MAXMIND_ACCOUNT_ID` | Ja (ny API-endpoint) | Konto-ID från MaxMind. Utelämnas den används den äldre `geoip_download`-URL:en med enbart licensnyckel. |
| `MAXMIND_LICENSE_KEY` | Ja | Licensnyckel från MaxMind. |
| `MAXMIND_DB_PATH` | Nej | Alternativ sökväg till `.mmdb`-filen. Default: `geodata/GeoLite2-City.mmdb`. |

**Nedladdning**

```bash
npm run geo:download        # skriver geodata/GeoLite2-City.mmdb (~70 MB)
```

`prebuild` kör samma script med `--optional`, så `npm run build` hämtar databasen
automatiskt när nycklarna finns och hoppar över den tyst när de inte gör det.
Databasfilen är gitignorerad och pekas in i Vercel-funktionen via
`outputFileTracingIncludes` för **enbart** `/api/analytics` (Vercels gräns är
250 MB uppackat per funktion).

**Graceful degradation:** saknas filen eller misslyckas uppslagningen behåller
analytics-routen bara Vercel-headerns data och loggar strukturerat
(`analytics_geo_db_unavailable`, `analytics_geo_header_gap`,
`analytics_geo_unresolved`). Ett event går aldrig förlorat på grund av geodata.

## Prestanda- och datatillgångsriktlinjer

- **Undvik N+1-frågor**: Använd set-baserade Prisma-queries (`findMany` med `include`/`select`/`_count`) i stället för att göra databasanrop i loopar.
- **Återanvänd helpers**: För återkommande datamönster (t.ex. dashboard-data) använd helpers i `src/lib` (t.ex. `getDashboardUserWithRecentOrders`) i stället för att skriva ad-hoc-queries i komponenter.
- **Filtrera och begränsa**: Lägg alltid på relevanta `where`-villkor och `take`/pagination för listor som kan växa (ordrar, analytics-events).
- **Indexmedvetenhet**: När du lägger till nya tunga queries, verifiera att motsvarande fält är indexerade i `prisma/schema.prisma` innan du går till produktion.