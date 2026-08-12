# App Review-granskning — AvyraCards (2026-08-12)

Genomgång av hela projektet mot Apples App Store Review Guidelines med
checklistan från [apple-app-review-skills](https://github.com/cruisediary/apple-app-review-skills)
(31 kontroller i sju kategorier), anpassad för en Capacitor-WebView-app.
De Swift-specifika kontrollerna (force unwrap, UIKit-layout, private API) är
inte tillämpliga — appen har i praktiken ingen egen Swift-kod utöver
Capacitor-skalet. I gengäld flyttas risken till webblagret och till
Info.plist/entitlements, och det är där granskningen har lagt tyngdpunkten.

Status per fynd: **ÅTGÄRDAT** = fixat i den här ändringen. **KVAR** = kräver
beslut, konfiguration eller manuell verifiering av dig.

---

## 🔴 Kritiskt — garanterat eller mycket sannolikt avslag

### 1. Ingen `PrivacyInfo.xcprivacy` — ITMS-91053 · Guideline 5.1 · ÅTGÄRDAT
App-targeten saknade helt privacy manifest. Apples automatiska pipeline
scannar binären efter "required reason API"-anrop och avvisar utan att en
människa ens tittar. Capacitors WKWebView-brygga läser och skriver
UserDefaults för targetens räkning, så anropen räknas som appens.

*Fix:* `ios/App/App/PrivacyInfo.xcprivacy` med `NSPrivacyTracking=false`,
insamlade datatyper och deklarationer för UserDefaults (CA92.1),
filtidsstämplar (C617.1), boot time (35F9.1) och diskutrymme (E174.1).
Filen är också inlagd i `project.pbxproj` som resurs i App-targeten —
ligger den bara på disk kommer den inte med i binären.

### 2. Publika profiler var UGC utan rapportera/blockera — Guideline 1.2 · ÅTGÄRDAT
`/u/[användarnamn]` visar användarens namn, presentationstext, profilbild och
länkar för vem som helst. Det är precis den definition av användarskapat
innehåll som Apple tillämpar, och 1.2 kräver då **fyra** saker: villkor som
förbjuder stötande innehåll, en rapportfunktion, en blockeringsfunktion och en
publicerad kontaktväg. Ingen av rapport-/blockeringsdelarna fanns.
Det här var den största dolda risken i projektet — link-in-bio-appar avslås
rutinmässigt på 1.2.

*Fix (full implementation):*
- Nya Prisma-modeller `ProfileReport` och `UserBlock` + migrering
  `20260812090000_ugc_safety_and_apple_revoke` (helt additiv).
- "Rapportera profil" och "Blockera" i foten av **både** social- och
  business-profilen. Rapportdialogen fungerar även utloggad — en besökare som
  scannat ett NFC-kort har inget konto.
- `POST /api/report` (rate-limitad per IP, svarar neutralt på okända
  användarnamn så att den inte går att använda för att kartlägga konton) och
  `POST/DELETE /api/block`.
- Fristående `/report`-sida, länkad från sidfoten — Apple vill se en fast
  rapportväg som går att länka till från App Store Connect.
- Blockering får faktisk effekt: en blockerad profil returnerar en egen vy i
  stället för innehållet, och besöket loggas inte i profilens statistik.
- Admin → Moderation (`/admin/reports`) med kö, statusbyte och avstängning.
  En avstängd profil ger 404 publikt men kontot finns kvar för överklagande.
- `/terms` §12: nolltolerans mot stötande innehåll, 24-timmarslöfte,
  rapport- och blockeringsvägar. Registreringen länkar till villkor och
  integritetspolicy i klartext.

### 3. Stripe kunde visas för premiumköp inne i appen — Guideline 3.1.1 · ÅTGÄRDAT
`PremiumCheckoutForm` visade IAP-knappen bara när `useIosNativePayments()` var
sant, annars Stripe-checkouten — **även i appen**. Eftersom hooken kräver
`NEXT_PUBLIC_IOS_NATIVE_PAYMENTS === "true"` räckte en saknad env-variabel i
Vercels produktionsmiljö för att granskaren skulle mötas av "Gå till
betalning" → Stripe. Det är ett garanterat avslag.

*Fix:* Stripe-grenen renderas nu på villkoret `!isApp`, alltså aldrig i appen.
Är IAP inte konfigurerat visas i stället ett meddelande plus möjligheten att
återställa tidigare köp. Fallback till extern betalning för digitalt innehåll
är därmed strukturellt omöjlig.

### 4. "Hantera via Stripe" i appen — Guideline 3.1.1 / 3.1.3 · ÅTGÄRDAT
Faktureringsvyn skickade premiumanvändare till Stripes kundportal. Dels är det
en extern betalväg för digitalt innehåll, dels hade knappen lett fel rent
funktionellt för någon som köpt via IAP — det abonnemanget finns inte i Stripe.

*Fix:* I appen visas "Hantera i App Store" som öppnar StoreKits
`manageSubscriptions()`. På webben är Stripe-portalen oförändrad.

---

## 🟠 Högt — vanlig avslagsorsak

### 5. Ingen "Återställ köp" — Guideline 3.1.1 · ÅTGÄRDAT
Sökning på `restore` i hela kodbasen gav noll träffar. Auto-förnyande
prenumerationer måste ha en synlig återställningsfunktion, och granskaren
testar den med ett konto som redan köpt.

*Fix:* `IosRestorePurchasesButton` — kör `restorePurchases()`, läser
transaktionerna med `getPurchases()` och skickar dem till den befintliga
verifieringsendpointen. Finns både på paywallen och i faktureringsvyn.

### 6. Paywallen saknade prenumerationsvillkor — Guideline 3.1.2(c) · ÅTGÄRDAT
Paywallen visade "199 kr/mån" och inget mer: ingen upplysning om automatisk
förnyelse, ingen uppsägningsinstruktion, inga länkar till villkor eller
integritetspolicy före köp. Uppgraderingsmodalen lovade dessutom "30 dagars
öppet köp" även i appen, där Apple hanterar återbetalningar — ett vilseledande
köpvillkor.

*Fix:* Ny `SubscriptionTerms`-komponent på paywallen med belopp, period,
"förnyas automatiskt tills du säger upp", uppsägningsväg (App Store-vägen i
appen, kontovägen på webben) samt länkar till `/terms` och `/privacy`.
Modalens ångerrättslöfte visas inte längre i appen.

### 7. Sign in with Apple återkallades inte vid kontoradering — TN3194 / 5.1.1(v) · ÅTGÄRDAT
Kontoraderingen var i övrigt gedigen (kaskad, frigör fysiska kort, spärrar
Wallet-passet), men Apple-kopplingen låg kvar under "Logga in med Apple" i
användarens iPhone-inställningar. Apple har avslagit appar på just det.

*Fix:* `authorizationCode` skickas nu från Sign in with Apple-knappen, växlas
serverside mot ett refresh token som sparas på användaren, och
`revokeAppleToken()` anropas vid radering. Misslyckas anropet fortsätter
raderingen ändå — den får aldrig blockeras av att Apple är nere.
**Kräver att `APPLE_TEAM_ID` sätts i miljön**, annars hoppas revoke över.

### 8. Push-dialogen visades direkt vid inloggning — 4.5.4 / 5.1.1(ii) · ÅTGÄRDAT
`PushManager` anropade `requestPermissions()` så fort dashboarden monterades.
"Permission requested at app launch with no context" är en av de vanligaste
avslagsorsakerna, och en avvisad systemdialog går inte att visa igen.

*Fix:* Appen kollar först `checkPermissions()`. Är läget "prompt" visas en
egen ruta som förklarar nyttan, och systemdialogen triggas först på klick.

### 9. Info.plist-brister · ÅTGÄRDAT
- `UIRequiredDeviceCapabilities = armv7` (Capacitor-arv, 32-bitars) → `arm64`.
- `ITSAppUsesNonExemptEncryption` saknades → satt till `false`, slipper
  exportfrågan vid varje uppladdning.
- `NSPhotoLibraryAddUsageDescription` saknades trots att appen sparar kort och
  QR-koder till fotobiblioteket.

Kamerans och fotobibliotekets befintliga texter är konkreta och godkända —
inga generiska "appen behöver åtkomst".

---

## 🟡 Kvarstår — kräver ditt beslut eller din miljö

### 10. `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS` måste vara `true` i produktion · KVAR
Efter fix 3 blir konsekvensen av en saknad flagga "premium går inte att köpa i
appen" i stället för ett avslag — men granskaren måste kunna genomföra köpet.
Verifiera i Vercels produktionsmiljö, tillsammans med `APPLE_IAP_*`.

### 11. Migreringen måste köras före merge till `main` · KVAR
`main` är produktionsbranch. Kör `prisma migrate deploy` mot Neon med den
direkta anslutningssträngen **först**, mergea sedan. Se
`prisma/migrations/20260812090000_ugc_safety_and_apple_revoke/README.md`.

### 12. Google AdSense på profiler visas även i appen · KVAR
`AdBanner` renderas för icke-premiumanvändare. Två saker att ta ställning till:
annonser i en WebView bryter mot AdSenses egna villkor (Google-risk, inte
Apple-risk), och annonsnätverk kan räknas som spårning — visas annonser
personaliserade krävs en ATT-prompt och `NSUserTrackingUsageDescription`.
Enklaste vägen förbi båda: dölj annonser när `isApp` är sant.

### 13. Offline-beteende · KVAR
`capacitor.config.ts` pekar `server.url` mot avyracards.se utan lokal fallback.
Tappar granskaren nätet får hen en vit skärm, vilket rapporteras som 2.1-krasch.
Testa appen i flygplansläge; överväg en enkel offline-vy.

### 14. iPad · KVAR
`TARGETED_DEVICE_FAMILY = "1,2"` — appen skickas som universell och granskarna
testar rutinmässigt på iPad Air. Kör igenom hela flödet på iPad i simulator,
i både stående och liggande läge, innan submission. Alternativet är att
begränsa till iPhone.

### 15. `NEXT_PUBLIC_IOS_DEBUG` · KVAR
Debug-endpoints och debugpanelen är korrekt gate:ade bakom flaggan. Bekräfta
bara att den inte är `true` i produktion vid submission.

### 16. App Store Connect-paketet · KVAR
Utanför kodbasen, men blockerar submission: Paid Apps-avtal med bank- och
skatteuppgifter, IAP-produkter i "Ready to Submit", demokonto i review notes,
skärmbilder från verkliga appvyer (inte splash), privacy labels som matchar
`PrivacyInfo.xcprivacy`, samt support- och privacy-URL:er som svarar 200.
Se `APP_REVIEW_NOTES.md` för färdiga formuleringar.

---

## Kontrollerat utan anmärkning

- Kontoradering finns i appen och är riktig radering, inte avstängning (5.1.1(v)).
- Sign in with Apple finns och är enda tredjepartsinloggningen (4.8).
- Integritetspolicy och villkor är nåbara i appen, inte bara i App Store Connect (5.1.1(i)).
- Inga platshållare: noll träffar på "lorem ipsum", "coming soon", "kommer snart".
- Ingen ATT-spårning, inga private API-anrop, ingen bakgrundsexekvering.
- Appnamnet "AvyraCards" är 10 tecken utan "beta"/"test" (metadata).
- Apple Pay-entitlementet används för fysiska kort — tillåtet enligt 3.1.3(e).
- Inga `SKStoreReviewController`-anrop, alltså ingen risk för 5.6.1.

## Verifiering av ändringen

- `npx tsc --noEmit` — rent.
- ESLint på samtliga nya och ändrade filer — rent.
- `npm test` gick **inte** att köra i granskningsmiljön (`node_modules` är
  installerat för Windows, rollups linux-binär saknas). Kör `npm test` lokalt
  innan du mergar.
