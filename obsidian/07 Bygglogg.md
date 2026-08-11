---
skapad: 2026-08-10
uppdaterad: 2026-08-11
---

# Bygglogg

Logg över autonoma byggsessioner. Nyast överst.

---

## 2026-08-11 — Session 3 (autonom)

### Gjort

**1. Premium-mallarna var i praktiken gratis — stängt (ClickUp 86c74tjrn / 86c7m20w3)**

Det här hittades när jag gick in i temasystemet för "engångsköps-mallar + ramar". Bakgrunden: 19 av 38 mallar är märkta `isPremium: true`, men

- `templates-tab.tsx` anropade `onApply(t)` för **alla** mallar oavsett `isPremium` — hänglåset var enbart en badge ovanpå knappen,
- `/api/themes/save` sanerade bara tre saker: bakgrundsbild, `hideBranding` och knappstilen `glass`.

En premium-mall som bygger på gradient eller solid färg (majoriteten) gick alltså rakt igenom både klient och server och sparades permanent på ett gratiskonto. Det är en ren intäktsläcka, inte bara ett kosmetiskt fel.

**2. Central feature-gating (ClickUp 86c777p5w, punkt 4 i arkitektur-backloggen)**

Ny modul `src/lib/feature-access.ts` som nu är enda stället som svarar på "får den här användaren göra X?":

- `FEATURES` — deklarativ config, `free` / `premium` / `admin` per feature.
- `canAccess(feature, user)` — admin har alltid tillgång, vilket också är den tänkta vägen för gift-/beta-konton utan att man rör `isPremium`.
- `sanitizeThemeSettings(settings, mode, user)` — en källa till sanning för vad servern tvättar bort. Returnerar `removed: FeatureKey[]` så UI:t kan bli specifikt senare ("du behöver premium för bakgrundsbild") i stället för dagens generella modal.
- `matchesLockedTemplate()` — servern jämför inkommande settings mot premium-mallarnas egna fält och känner igen en mall som postas direkt mot API:t. UI-lås är inget skydd; det här är det som faktiskt stoppar en curl mot `/api/themes/save`.

Inkopplat på tre ställen: API-routen (ersatte sin egna ad hoc-logik), `TemplatesTab` (låsta mallar får dämpad preview och öppnar uppgraderingsmodalen i stället för att appliceras) och `themes/page.tsx` (hämtar `role` så admin-overriden funkar hela vägen ner).

**Viktigt: inga befintliga gränser flyttades.** Det som var gratis igår är gratis idag — den enda beteendeändringen är att premium-mallar nu faktiskt kräver premium.

**3. Tester**

15 nya Vitest-tester i `src/lib/__tests__/feature-access.test.ts`, inklusive ett explicit regressionsskydd för läckan (spara en premium-malls settings som gratiskonto → ska inte längre matcha mallen efteråt). Totalt nu 48 tester, alla gröna.

Kvalitetsgrindar före push: `npm run lint` ✔, `npx tsc --noEmit` ✔ (noll fel), `npx vitest run` ✔ (48/48).

### Efterhandslogg: session 2 (loggades aldrig)

Session 2 pushade två commits utan att uppdatera byggloggen — för spårbarhetens skull:

- `a9ed39f` **fix(security)** — kortaktivering kunde kringgås helt. `/activate/confirm` kontrollerade ingen token alls, och `/api/cards/claim` kontrollerade bara om anroparen råkade skicka med fältet. Den som kände till kortkoden (6 tecken, tryckt på kortet) kunde alltså aktivera ett kort som låg oöppnat hos kunden. Ny delad modul `src/lib/card-claim.ts`: token krävs alltid, timing-safe jämförelse, atomisk claim, token roteras vid aktivering.
- `3815432` **fix(wallet)** — Google Wallet på Android (ClickUp 86ca6yh4y). Rotorsak: `genericClass`-payloaden var ogiltig och avvisades med 400, men felet svaldes av ett catch märkt "non-fatal". Utan klass lades hela objektet i JWT:n → save-URL på flera tusen tecken, vilket Android inte klarar. Tre fel rättade mot Googles referensdokumentation.

### Återstår / nästa session

1. **Kör igenom [[08 Testchecklista]]** — fortfarande inget av kodfixarna verifierat live. Särskilt B (profilbild), H (premium i iOS-appen) och nu även: gratiskonto ska inte kunna välja en låst mall.
2. **Google Wallet-fixen är inte verifierad på riktig Android-enhet** — koden är rättad mot dokumentationen, men det behöver testas skarpt.
3. **Ramar (frames)** — mekaniken finns (`PREMIUM_FRAME_STYLES` i `feature-access.ts`), men listan är medvetet tom. Se fråga nedan.
4. **Engångsköps-mallar** — ClickUp-tasken har tom beskrivning. Se fråga nedan.
5. **Arkitektur-backloggen** (86c777p5w): punkt 4 är nu grundlagd. Kvarstår punkt 1 (analytics-lager / event-schema), punkt 2 (rate limiting — delvis gjord i session 1), punkt 5 (wallet lifecycle).

### Frågor till Oskar

- **Vilka ramar ska vara premium?** Alla åtta (`none, circle, rounded, ring, glow, hexagon, square, shadow`) är gratis idag. Jag lade INTE någon bakom betalväggen på eget bevåg, eftersom befintliga användare som redan valt t.ex. `glow` då skulle få den nedgraderad nästa gång de sparar. Säg vilka du vill låsa så är det en enradsändring i `PREMIUM_FRAME_STYLES`. Mitt förslag: `glow`, `hexagon`, `shadow` som premium — resten gratis.
- **"Engångsköps-mallar" (86c74tjrn) — vad menas konkret?** Tasken har tom beskrivning. Är det (a) mallar som säljs styckvis utanför premium-abonnemanget, eller (b) bara "det ska finnas färdiga mallar att välja mellan" (vilket i så fall redan är gjort — 38 st)? Om (a) krävs ny datamodell (ägda mallar per användare) + Stripe-produkter, och det är för stort att göra blint.
- Frågorna från session 1 står kvar obesvarade: `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS` i produktion, död kod (`/api/upload/profile-image`, `ProfileSettingsForm`), samt om kort ska sättas tillbaka till `UNCLAIMED` vid kontoradering.

---

## 2026-08-10 — Session 1 (autonom)

### Gjort

**1. Bugg "gick ej att byta profilbild" (ClickUp 86c9nv6uw) — verifierad som fixad i koden**

Gick igenom hela kedjan: `AvatarUploader` → `/api/upload` (Vercel Blob) → `PATCH /api/profile` → publik profil. Fixen finns redan i `main` (commit `5450de1`):

- `social-profile-form.tsx` och `business-profile-form.tsx` sparar nu bilden direkt vid uppladdning i stället för att kräva ett extra klick på "Spara ändringar" — det var grundorsaken (användare trodde bytet misslyckats).
- `/api/upload` har auth-kontroll, userId i blob-sökvägen och tydliga felmeddelanden.
- `avatarSchema` i `/api/profile` accepterar både URL och base64.

**Ingen ny kodändring behövdes** — men flödet är INTE verifierat live. Ligger som punkt B i [[08 Testchecklista]]. Rekommendation: kör igenom den punkten på både webb och TestFlight innan tasken stängs.

**2. App Review-krav verifierade i kod (Fas 1.1 + 1.2 i [[03 Plan – Apple Submission]])**

*(a) Guideline 3.1.1 — premium via IAP:* Kontrollerade alla ställen som leder till premiumköp. Samtliga går via `/checkout/premium`, som i native-läge (`useIosNativePayments()`) byter ut Stripe-knappen mot `IosIapPremiumButton`. Kortbeställningens "Pro (6 mån premium)" hanteras korrekt av `ios-order-checkout.tsx`: premium köps via App Store FÖRST, därefter Apple Pay för det fysiska kortet med `premiumOption: "none"`. **Ser rätt ut i koden.**

*(b) Guideline 5.1.1(v) — kontoradering:* `DELETE /api/account` finns och är nåbar från Inställningar → "Radera konto" (`account-form.tsx`) med dubbel bekräftelse + `signOut`. Kontrollerade även Prisma-relationerna: `Link` och `AnalyticsEvent` har `onDelete: Cascade`, `Order.userId` och `Card.assignedUserId` är valfria (Prisma sätter dem till null). Raderingen bör alltså inte falla på foreign key-fel. **Ser rätt ut i koden.**

**3. Regressionstester (ClickUp 86c6rbe2j)**

- `npm test` / `npm run test:watch` tillagt i `package.json`.
- 20 nya Vitest-tester i `src/lib/__tests__/`:
  - `profile-mapper.test.ts` (11) — avatar-fallback SOCIAL/BUSINESS, headline-fallback, vCard-knappens ordning och `showSaveContact`, länkfiltrering per läge/aktiv, URL-normalisering av boknings-/webblänkar.
  - `ios-native.test.ts` (6) — låser fast att `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS` bara räknas som på för exakt `"true"` (skydd mot att ett env-stavfel tyst öppnar Stripe-vägen i iOS-appen igen), samt IAP-produktmappning och `isAppleIapConfigured`.
  - `rate-limit.test.ts` (3) — skyddet för claim-flödet och publika avatar-routes.
- Totalt: 22 tester, alla gröna.
- Manuell testchecklista skapad: [[08 Testchecklista]] (11 avsnitt, A–K).

**4. Städning så att kvalitetsgrindarna faktiskt går igenom**

- `src/app/api/debug/ios-native-log/route.ts` — tre typfel (`req.nextUrl` på en vanlig `Request`), bytt till `new URL(req.url)`. Byggen fångade inte detta eftersom `ignoreBuildErrors` är på.
- `src/lib/push.ts` — oanvänd `firebase-admin`-import borttagen (enda lint-felet i projektet).

Efter detta: `npm run lint` ✔, `npx tsc --noEmit` ✔ (noll fel), `npx vitest run` ✔ (22/22).

### Återstår / nästa session

1. **Kör igenom [[08 Testchecklista]]** — särskilt B (profilbild) och H (premium i iOS-appen). Koden ser rätt ut, men inget av detta är verifierat live.
2. **Google Wallet-buggen på Android** (ClickUp 86ca6yh4y) — `/api/wallet/google` är inte felsökt ännu. Nästa tekniska punkt i prioritetsordningen.
3. **Engångsköps-mallar + ramar i teman** (ClickUp 86c74tjrn).
4. **Arkitektur-backloggen** (ClickUp 86c777p5w): analytics-lager → rate limiting → feature-gating.
5. Fas 2 i [[03 Plan – Apple Submission]] (App Store Connect-paketet) kräver ingen kod och kan köras parallellt.

### Frågor till Oskar

- **Är `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS=true` satt i produktionsmiljön på Vercel?** Jag rör inte env-variabler, men koden är helt beroende av att flaggan är på i det bygge reviewern ser. Är den av visas Stripe-checkout för premium i iOS-appen → nästan säkert avslag på 3.1.1. Kolla i Vercel → Settings → Environment Variables (Production).
- **`/api/upload/profile-image` returnerar hårdkodat 501 och anropas inte från någonstans.** Ser ut som en rest från ett tidigare försök. Ska den bort? Jag lät den ligga kvar för att inte råka bryta något externt.
- **Kort som blir kvar när ett konto raderas:** `Card.assignedUserId` sätts till null men `status` står kvar som `CLAIMED`, så kortet går inte att claima igen. Ingen App Review-blocker, men det innebär att ett fysiskt kort blir obrukbart om ägaren raderar sitt konto. Vill du att jag sätter tillbaka status till `UNCLAIMED` vid radering? Rör inte det utan besked eftersom det påverkar användardata.
- `ProfileSettingsForm` (`src/components/profile/profile-settings-form.tsx`) importeras inte av något — död kod. Ska den bort?
