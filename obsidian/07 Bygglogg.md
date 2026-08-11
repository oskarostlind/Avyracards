---
skapad: 2026-08-10
uppdaterad: 2026-08-11
---

# Bygglogg

Logg över autonoma byggsessioner. Nyast överst.

---

## 2026-08-11 — Session 5 (autonom)

### Gjort

**Wallet-pass lifecycle (ClickUp 86c777p5w, punkt 5)**

Alla tekniska lanseringsbuggar i prioritetslistan är avklarade i kod, så sessionen tog
nästa punkt i arkitektur-backloggen.

Rotproblemet: ett wallet-pass byggdes **bara i det ögonblick användaren tryckte "Lägg
till i Wallet"** och rördes sedan aldrig igen. Ändrade användaren namn, titel, bild
eller användarnamn låg det gamla passet kvar oförändrat i telefonen. Värst i fallet
användarnamn — då pekade QR-koden på `/u/<gammalt-namn>`, alltså en profil som inte
längre finns. Ett tryckt visitkort som slutar fungera efter en profiländring är precis
den sortens "Wallet visar fel"-bugg som backloggen varnar för.

Google Wallet-objekt är serverägda: en PATCH mot objektet propagerar till alla enheter
som har passet sparat. Det är den mekaniken som nu används.

Två nya moduler:

- **`src/lib/wallet/pass-content.ts`** — en källa till sanning för *vad* ett pass visar
  (namn, rubrik, QR-länk, visad länk, bild). Reglerna speglar `getProfileData()` i
  profile-mapper så att passet och den publika profilen alltid visar samma sak.
- **`src/lib/wallet/google.ts`** — id-generering, credential-tvätt, objektbyggare och
  själva lifecycle-funktionerna `syncGoogleWalletPass()` och `expireGoogleWalletPass()`.

Inkopplat på tre ställen:

1. **`PATCH /api/profile`** — synkar passet när ett passrelevant fält ändrats. Sparningar
   som bara rör tema, länkar eller redirect gör inget API-anrop alls.
2. **`DELETE /api/account`** — passet markeras `EXPIRED` i stället för att ligga kvar och
   visa en QR-kod mot en raderad profil. Körs *efter* raderingen och kan inte kasta, så
   kontoraderingen (Apple 5.1.1(v)) aldrig kan se ut att misslyckas på grund av Google.
3. **`/api/wallet/google` + `/api/wallet/apple`** — save-flödena bygger nu passet via
   samma moduler, så ett uppdaterat pass har exakt samma form som ett nyskapat.

**Tre buggar rättade på köpet** (alla följdeffekter av att Apple- och Google-routerna
hade varsin egen tolkning av användaren):

1. **Fel bild och rubrik för BUSINESS-konton.** Båda passen använde alltid `avatarUrl`
   och `bio`/`jobTitle`, medan den publika profilen i BUSINESS-läge visar
   `businessAvatarUrl` och `businessHeadline`. Passet kunde alltså visa en annan person
   än profilen det leder till.
2. **Apple-passet skrev hårdkodat `avyracards.com/u/...`** som synlig profil-länk, trots
   att domänen är `.se`. Google hade en normalisering, Apple inte. Nu normaliseras
   domänen centralt — för båda.
3. **Base64-avatarer.** `/api/profile` tillåter data-URI som avatar. Google Wallet hämtar
   bilden själv från en publik URL och Apple läser den via `fetch` — båda misslyckas tyst
   på en data-URI. Nu faller passet tillbaka på AvyraCards-logotypen i stället.

**Synken kastar aldrig.** Ett Google-fel loggas och släpps; profilsparningen ska inte
kunna fallera för att Wallet-API:t har en dålig dag. Existerar inget objekt (404) har
användaren aldrig sparat passet — då skapas inget nytt, eftersom ett pass ingen bett om
bara kostar API-anrop.

**Ingen databasmigrering.** Backloggen föreslår att `wallet_pass_id` och `platform`
lagras. Det behövs inte för Google: objekt-id:t är deterministiskt (`<issuer>.user-<id>`),
så passet går alltid att hitta utifrån användar-id. Att lägga till en tabell hade krävt
en migrering — och migreringar körs inte automatiskt vid deploy, så en omigrerad
schemaändring hade tagit ner sajten.

**Tester:** 21 nya Vitest-tester i `src/lib/__tests__/wallet-pass.test.ts`. Totalt 94,
alla gröna. `npm run lint` OK, `npx tsc --noEmit` OK (noll fel), `npm run build` OK.

Manuell testchecklista utökad med avsnitt N i [[08 Testchecklista]].

### Återstår / nästa session

1. **[[08 Testchecklista]] är fortfarande inte körd** — nu 14 avsnitt (A–N). Inget av
   kodfixarna från session 1–5 är verifierat live. Det är fortfarande den enskilt största
   återstående risken inför lansering.
2. **Apple-passet kan inte uppdateras alls.** Se frågan nedan — det är ett större jobb
   och kräver beslut från dig.
3. **Arkitektur-backloggen (86c777p5w):** punkt 1, 2, 4 och 5 (Google-delen) är gjorda.
   Kvar: punkt 3 (profilversionering), punkt 6 (systemmail), punkt 7 (miljöseparation),
   punkt 8 (B2B-datamodell). Nästa i tur enligt beskrivningens ordning: punkt 6, systemmail
   — Resend finns redan i projektet, så det är den billigaste kvarvarande punkten.
4. **Ramar och engångsköps-mallar** (86c74tjrn) — blockerat på frågorna nedan.

### Frågor till Oskar

- **Ska Apple Wallet-passet kunna uppdateras?** Google-passet uppdateras nu automatiskt,
  Apple-passet gör det inte — och kan inte göra det som koden ser ut. Apple kräver att
  passet innehåller `webServiceURL` + `authenticationToken` och att vi driftar en
  web service med fyra endpoints för enhetsregistrering, plus APNs-push med ett separat
  certifikat. Det är ungefär en dag jobb, kräver en ny databastabell (registrerade
  enheter → alltså en migrering som måste köras manuellt) och ett APNs-cert i Apple
  Developer. **Jag gör det inte utan besked.** Notera att redan sparade Apple-pass aldrig
  kommer kunna uppdateras — `webServiceURL` bakas in i passet vid skapandet, så bara pass
  som sparas *efter* en sådan ändring omfattas. Det talar för att göra det före lansering
  om det ska göras alls.
- **Admin "force refresh" av pass** (också del av backloggens punkt 5) byggdes inte —
  supportverktyg utan support-UI känns förhastat. Säg till om du vill ha en enkel
  admin-knapp så lägger jag den på en befintlig adminsida.
- Frågorna från session 1–4 står kvar obesvarade: `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS` i
  produktion, delad lagring (Redis) för dedup/rate limiting, bot-trafik i statistiken,
  vilka ramar som ska vara premium, vad "engångsköps-mallar" konkret betyder, samt död
  kod (`/api/upload/profile-image`, `ProfileSettingsForm`).

---

## 2026-08-11 — Session 4 (autonom)

### Gjort

**Centralt analytics-lager (ClickUp 86c777p5w, punkt 1 + resten av punkt 2)**

Alla tekniska lanseringsbuggar i prioritetslistan är avklarade i kod, så den här
sessionen tog nästa punkt i arkitektur-backloggen: event- och analyticsarkitekturen.

Rotproblemet var att *klienten* bestämde vad statistiken skulle innehålla.
`trackers.tsx` gissade källa ur `document.referrer` och enhet ur `navigator.userAgent`,
skickade resultatet till `/api/analytics`, och routen sparade det rakt av. Dashboarden
hade i sin tur en egen, delvis annorlunda, översättningstabell. Tre ställen som kunde
glida isär — och en öppen väg för vem som helst att posta godtyckliga källnamn.

Ny modul `src/lib/analytics/events.ts`:

- **Versionerat event-schema** — `ANALYTICS_SCHEMA_VERSION = 1` plus zod-validering av
  inkommande payload. Höjs när formatet ändras på ett sätt som kräver backfill.
- **All normalisering på servern** — källa och enhet härleds ur referrer och user-agent
  i backend. Klienten skickar bara rådata. Äldre klientbyggen som fortfarande skickar
  härledda värden fungerar oförändrat (bakåtkompatibel passlista).
- **Bot-filter** — länkförhandsvisare (facebookexternalhit, WhatsApp, Slackbot, Discord,
  Telegram m.fl.) och crawlers lagras inte längre som profilvisningar. Varje gång någon
  klistrade in sin profillänk i en chatt fick de tidigare en falsk visning.
- **Dedup** — samma besökare, samma event, inom 10 sekunder räknas en gång. Skyddar mot
  refresh-spam. *Begränsning:* dedup-fönstret ligger i minnet per instans, precis som
  rate-limitern, så i serverless kan enstaka dubbletter slinka igenom när trafiken
  sprids över flera instanser. Fullt skydd kräver delad lagring (Redis/Upstash) — se
  fråga nedan.
- **Skräpskydd** — godtycklig text i `source` kastas nu i stället för att lagras. Förut
  kunde vem som helst posta valfri sträng som "trafikkälla".
- **Delad läs- och skrivväg** — `getReadableSource` bor i samma modul och används av
  dashboarden. Fungerar även på historiska rader.

Två buggar rättade på köpet:

1. Android-plattor klassades som "Desktop" (user-agenten saknar "Mobile", och det gamla
   `/ipad|tablet/`-testet matchade inte).
2. All Instagram-trafik redovisades som "Instagram Bio", eftersom dashboarden mappade
   `instagram` till samma etikett som `link_bio`. Nu skiljs bio-länken från delade länkar.

Analytics-routen använder nu den delade rate-limitern i `src/lib/rate-limit.ts` i stället
för en egen kopia av samma logik, och bot-/dedup-kontrollen körs *före* det externa
geo-anropet så att vi inte betalar för trafik som ändå kastas.

**Ingen databasmigrering.** Schemat är orört med flit: en migrering som inte är körd mot
produktion skulle ta ner sajten vid deploy, eftersom bygget inte kör `migrate deploy`.
Bot-trafik kastas därför i stället för att lagras med en `isBot`-flagga.

**Tester:** 25 nya Vitest-tester i `src/lib/__tests__/analytics-events.test.ts`. Totalt 73,
alla gröna. `npm run lint` OK, `npx tsc --noEmit` OK (noll fel).

Manuell testchecklista utökad med avsnitt M i [[08 Testchecklista]].

### Återstår / nästa session

1. **[[08 Testchecklista]] är fortfarande inte körd** — nu 13 avsnitt (A–M). Ingen av
   kodfixarna från session 1–4 är verifierad live. Det här är den enskilt största
   återstående risken inför lansering.
2. **Google Wallet-fixen är inte verifierad på riktig Android-enhet.**
3. **Arkitektur-backloggen (86c777p5w):** punkt 1, 2 och 4 är nu gjorda. Kvar: punkt 5
   (wallet lifecycle), punkt 3 (profilversionering), punkt 6 (systemmail), punkt 7
   (miljöseparation), punkt 8 (B2B-datamodell). Nästa i tur enligt beskrivningens
   ordning: punkt 5, wallet lifecycle.
4. **Ramar och engångsköps-mallar** (86c74tjrn) — blockerat på frågorna nedan.

### Frågor till Oskar

- **Ska dedup och rate limiting flyttas till delad lagring?** Båda ligger i minnet per
  serverless-instans idag, vilket ger ett hyggligt men inte vattentätt skydd. Upstash
  Redis är gratis upp till en bra bit över nuvarande trafik och är en halvdagsinsats.
  Jag gör det inte utan besked eftersom det kräver ett nytt konto och nya env-variabler.
- **Vill du kunna se bortfiltrerad bot-trafik?** Just nu kastas den helt. Att i stället
  spara den med en flagga kräver en databasmigrering — och migreringar körs inte
  automatiskt vid deploy idag, så det behöver göras manuellt av dig.
- Frågorna från session 1–3 står kvar obesvarade: `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS` i
  produktion, vilka ramar som ska vara premium, vad "engångsköps-mallar" konkret betyder,
  död kod (`/api/upload/profile-image`, `ProfileSettingsForm`), samt om kort ska sättas
  tillbaka till `UNCLAIMED` vid kontoradering.

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
