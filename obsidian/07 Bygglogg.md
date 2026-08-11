---
skapad: 2026-08-10
uppdaterad: 2026-08-11
---

# Bygglogg

Logg över autonoma byggsessioner. Nyast överst.

---

## 2026-08-11 — Session 7b (uppföljning på fråga från Oskar)

Oskar frågade: fungerar wallet för Apple och Google, i appen och på webben?
Genomgång av hela kedjan (`/api/wallet/apple`, `/api/wallet/google`,
`/api/wallet/token`, `pass-content.ts`, `public-profile-card.tsx`). Läget i
koden, och tre fixar.

**Fungerar i koden:**

- **Google Wallet** — save-URL:en är kort sedan session 2 (objektet skapas
  server-side, JWT:n innehåller bara id + classId), klassen skapas med giltig
  payload, och passet uppdateras vid varje tryck. Fel visas som en läsbar sida
  i stället för rå JSON.
- **Apple Wallet** — passet signeras med certifikat från env och serveras som
  `application/vnd.apple.pkpass`.
- **Sessionsproblemet i appen är löst** — passen öppnas via `window.open` i
  systemwebbläsaren, som inte delar Capacitor-WebViewens cookie. Därför hämtas
  först en femminuterstoken från `/api/wallet/token` och skickas med i länken.

**Tre brister, alla åtgärdade i den här sessionen:**

1. **Ingen plattformskontroll i UI:t.** Båda knapparna visades på alla enheter.
   En Android-användare som tryckte "Apple Wallet" fick en `.pkpass` som Android
   inte kan öppna — filen laddades ner och sedan hände ingenting. Ny modul
   `src/lib/wallet/platform.ts`: iPhone/iPad → bara Apple, Android → bara
   Google, dator → båda (macOS har Wallet, Google Wallet sparar till kontot).
   5 tester.
2. **Apple-routen saknade Googles kontroll av användarnamn.** Utan användarnamn
   blev QR-koden `/u/?source=wallet` — en länk som inte leder någonstans. Ett
   pkpass går inte att rätta i efterhand när det ligger i telefonen. Nu 400 med
   samma text som Google-routen ger.
3. **`public/wallet/*.png` lästes vid körning utan att vara spårad.** Routen gör
   `fs.readFile(process.cwd() + "/public/wallet/icon.png")`, och Next kan inte
   spåra en dynamiskt byggd sökväg. Filerna riskerade att saknas i
   produktionsbundlen (ENOENT → 500 på passet). `outputFileTracingIncludes` för
   `/api/wallet/apple` tillagt i `next.config.mjs`.

Kvalitetsgrindar: lint ✔, tsc ✔, vitest ✔ (135/135), build ✔.

**Kvar på wallet (inte åtgärdat):**

- **Apple-passet uppdateras aldrig efter att det sparats.** Passet saknar
  `webServiceURL` och `authenticationToken`, så byter användaren namn eller bild
  ligger det gamla passet kvar. Google-passet uppdateras. Att fixa kräver en
  egen pass-webbtjänst (register/unregister/get-endpoints + push via APNs med
  pass-certifikatet) — större arbete, se session 5.
- **Bildstorlekar.** `public/wallet/logo.png` är 1536×1024 px och 814 kB.
  Apples spec för en generic pass-logotyp är max 160×50 pt (480×150 px @3x).
  Passet blir onödigt tungt och logotypen kan renderas oskarpt. Bör beskäras.
- **Inget av detta är verifierat på riktig enhet** — allt ovan är läst i koden.
  Se avsnitt I i [[08 Testchecklista]].

**Om migreringen:** Oskar svarade att jag har åtkomst till Neon-databasen, men
den här sessionen har ingen anslutningssträng — ingen `.env` i repot (rätt),
ingen `DATABASE_URL` i miljön och ingen Neon-integration bland verktygen. Ingen
migrering kördes. Se sammanfattningen i svaret för vad som behövs.

---

## 2026-08-11 — Session 7 (autonom)

### Gjort

**Miljöseparation & config-hygien (ClickUp 86c777p5w, punkt 7)**

Alla tekniska buggar i prioritetslistan är avklarade i kod sedan tidigare
sessioner, så sessionen tog nästa punkt i arkitektur-backloggen.

Punkten är till stor del en Vercel-uppgift (vilka variabler som är satta var),
och det är inget en autonom session kan eller ska röra. Däremot går det att
bygga *kontrollen* — och den saknades helt. Läget innan: systemet läser drygt
40 miljövariabler, och i stort sett varje beroende faller tillbaka tyst när en
variabel saknas. Tyst fallback är rätt i drift, men det innebär också att en
saknad variabel upptäcks först när en kund hör av sig. Dessutom fanns ingen
kod som skiljer en **preview-deploy** från **produktion** — `NODE_ENV` är
"production" i båda.

**Tre delar:**

- **`src/lib/config/environment.ts`** — `getAppEnvironment()` läser `VERCEL_ENV`
  först (production / preview / development) och faller tillbaka på `NODE_ENV`.
  Dessutom `getStripeKeyMode()` som avgör om en nyckel är live eller test utifrån
  prefixet, utan att returnera värdet, och `getStripeModeReport()` som svarar på
  två frågor: hör hemlig och publik nyckel till samma läge, och matchar läget
  miljön (live i produktion, test i preview/lokalt)? Stripes platshållare i
  `stripe.ts` (`sk_test_missing_key_placeholder`) räknas som "saknad", inte som
  en testnyckel — annars hade en helt okonfigurerad miljö sett frisk ut.
- **`src/lib/config/health.ts`** — `buildConfigReport()` bygger en rapport i sex
  grupper: plattform, betalningar, Apple IAP, systemmail, wallet och push. Varje
  kontroll får status `ok` / `warn` / `error` / `off` plus en förklaring på
  svenska. Skillnaden mellan `off` och `error` är miljöberoende: saknad SMTP
  lokalt är "av", saknad SMTP i produktion är ett fel.
- **`/admin/system`** — adminskyddad sida (samma `role !== "ADMIN"` → redirect
  som resten av admin) som renderar rapporten. Länkad från adminsidans knappsrad.
  `force-dynamic`, eftersom en cachad konfigurationsrapport vore värdelös.

**Rapporten innehåller aldrig ett hemligt värde.** Bara "satt/inte satt", läge
(live/test) och en förklarande text. Ett test låser fast det: en miljö där
nycklar och lösenord innehåller strängen `SUPERHEMLIGT` serialiseras och testet
kräver att strängen inte finns någonstans i rapporten.

**Sidan besvarar tre av de frågor som stått obesvarade sedan session 1.** I
stället för att fråga om `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS` är satt i produktion,
om SMTP är konfigurerat och om Stripe kör live-nycklar, kan Oskar öppna
`avyracards.se/admin/system` och läsa av det. Särskilt viktig är
`NEXT_PUBLIC_IOS_NATIVE_PAYMENTS`: kontrollen larmar även när variabeln är satt
till något annat än exakt `"true"` (t.ex. `1` eller `True`), eftersom koden bara
accepterar exakt den strängen — ett stavfel där hade tyst öppnat Stripe-checkout
i iOS-appen och nästan säkert gett avslag på App Store-riktlinje 3.1.1.

**Tester:** 16 nya Vitest-tester i `src/lib/__tests__/config.test.ts`
(miljödetektering, nyckellägen, miljöberoende allvarlighetsgrad, SMTP-fallback
till `STRATO_*`, hemlighetsläckage). Totalt 130, alla gröna.

Kvalitetsgrindar: `npm run lint` ✔, `npx tsc --noEmit` ✔ (noll fel),
`npx vitest run` ✔ (130/130), `npm run build` ✔.

Manuell testchecklista utökad med avsnitt P i [[08 Testchecklista]].

### Återstår / nästa session

1. **[[08 Testchecklista]] är fortfarande inte körd** — nu 16 avsnitt (A–P).
   Inget av kodfixarna från session 1–7 är verifierat live. Det är fortfarande
   den enskilt största återstående risken inför lansering. Den nya sidan
   `/admin/system` är det snabbaste stället att börja: den tar 30 sekunder och
   avslöjar direkt om produktionsmiljön saknar något.
2. **Arkitektur-backloggen (86c777p5w):** punkt 1, 2, 4, 5, 6 och 7 är gjorda.
   Kvar: punkt 3 (profilversionering) och punkt 8 (B2B-datamodell). Båda kräver
   nya databasfält, och där ligger ett hinder — se frågan nedan.
3. **Ramar och engångsköps-mallar** (86c74tjrn) — blockerat på obesvarade frågor.
4. **Apple Wallet-uppdatering** — blockerat, se session 5.

### Frågor till Oskar

- **Hur ska databasmigreringar köras i produktion?** `npm run build` kör bara
  `next build` — ingen `prisma migrate deploy`. De två sista punkterna i
  arkitektur-backloggen (profilversionering, organization_id) kräver båda nya
  kolumner, och att pusha en schemaändring till main utan att migreringen körts
  i produktionsdatabasen skulle ge körfel i drift. Jag rör inte
  produktionsmigreringar enligt instruktionen, så jag behöver antingen (a) att
  du kör migreringen manuellt när jag lagt migrationsfilen, eller (b) besked om
  att `prisma migrate deploy` får läggas in i byggsteget. Utan svar är de två
  återstående backloggpunkterna blockerade.
- Obesvarade frågor från session 1–6 står kvar: vilka ramar som ska vara
  premium, vad "engångsköps-mallar" betyder, Apple Wallet-uppdatering, kvitto i
  orderbekräftelsen, intern kopia på nya ordrar, död kod
  (`/api/upload/profile-image`, `ProfileSettingsForm`), samt om kort ska sättas
  tillbaka till `UNCLAIMED` vid kontoradering.
  *(Frågorna om `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS` och SMTP i produktion utgår —
  de går nu att svara på själv via `/admin/system`.)*

---

## 2026-08-11 — Session 6b (autonom, uppföljning)

### Gjort

**All e-post går nu via Resend — och avyracards.se är tillagd där**

Oskars besked efter session 6: allt ska via Resend, inte SMTP. Genomfört i hela
kedjan, inte bara för de nya systemmailen.

**1. Domänen tillagd i Resend**

`avyracards.se` är skapad i Resend-kontot, region `eu-west-1` (samma som de andra
domänerna i kontot). Status: `not_started` — den blir verifierad först när DNS-posterna
nedan ligger på plats. **Det här är enda återstående steget innan mail kan gå ut.**

DNS-poster att lägga in hos domänleverantören:

| Typ | Namn | Värde | Prio |
|-----|------|-------|------|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDY0ufoX+DkSwkCYhmzGMKYcs0qZlhDm0EKEba+DVRcOKHIZL4I+MPO2dMpmTaqRZ5lWW9xXtKoTQYeBnBGo9F68ZgIvTqZXP6hlljk3inHrsvUBxO0e9GcrqJM8arNnDlKH8jbsI3Z61G+gIV/tMDfENlGZUulrhOm5kycGaqC2wIDAQAB` | — |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |

TTL: auto. När de ligger inne: kör verifieringen i Resend (går att göra härifrån
nästa session, eller i Resends webbgränssnitt).

**2. Koden bytt från nodemailer till Resend**

`src/lib/mailer.ts` är omskriven mot Resend-SDK:n (paketet fanns redan som beroende
men användes inte). Gäller *all* utgående post — verifieringsmail, lösenordsåterställning
och de tre systemmailen från session 6. Publika API:t (`sendMail` / `sendMailSafe` /
`isMailerConfigured`) är oförändrat, så inga anropsställen behövde röras.

**En fälla värd att notera:** Resend-SDK:n kastar inte vid API-fel — den returnerar
`{ data, error }`. Utan en explicit kontroll av `error` hade ett avvisat mail (t.ex.
just "domänen är inte verifierad") loggats som ett lyckat utskick, och vi hade trott
att kunderna fick mail när de inte gjorde det. `sendMail` kastar nu på `error`, och
`sendMailSafe` fångar det till en loggrad.

**3. Nya miljövariabler**

| Variabel | Krävs | Beskrivning |
|----------|-------|-------------|
| `RESEND_API_KEY` | Ja | Utan den skickas inga mail alls — bara en varning i loggen. Inget flöde går sönder. |
| `MAIL_FROM` | Nej | Standard: `AvyraCards <no-reply@avyracards.se>`. Domänen måste vara verifierad i Resend. |
| `MAIL_REPLY_TO` | Nej | Sätt till t.ex. supportadressen om svar ska gå någonstans. |

`SMTP_FROM` läses fortfarande som fallback för `MAIL_FROM`, så en miljö som inte hunnit
få den nya variabeln tystnar inte. Övriga `SMTP_*`-variabler används inte längre och kan
tas bort ur Vercel när Resend är verifierat.

**4. nodemailer avinstallerat.** Inga användningar kvar i koden.

**Tester:** 8 nya (totalt 122, alla gröna). Resend-klienten mockas, så testerna
verifierar avsändare, `replyTo`, att `error`-svaret behandlas som fel, att nätverksfel
inte kastar vidare, och att inget anrop görs alls vid ogiltig mottagare.
`npm run lint` OK, `npx tsc --noEmit` OK, `npm run build` OK.

### Återstår / nästa session

1. **Lägg in DNS-posterna ovan och verifiera domänen i Resend.** Tills det är gjort
   går inga mail ut — varken de nya systemmailen eller verifieringsmailet vid
   registrering. Det senare är värt att notera: registreringsflödet blir beroende av
   att det här är klart.
2. **Sätt `RESEND_API_KEY` i Vercel (Production).** Jag rör inte env-variabler.
3. Punkterna från session 6 står kvar: [[08 Testchecklista]] är fortfarande inte körd
   (15 avsnitt, A–O).

### Frågor till Oskar

- **Vilken avsändaradress vill du ha?** Jag satte `no-reply@avyracards.se` som standard.
  Vill du hellre ha `hej@` eller `support@` är det en env-variabel (`MAIL_FROM`), ingen
  kodändring.
- **Ska svar på systemmail gå någonstans?** `MAIL_REPLY_TO` är osatt, så svar går till
  no-reply. En supportadress där är förmodligen bättre inför lansering.

---

## 2026-08-11 — Session 6 (autonom)

### Gjort

**Systemmail & central notifieringstjänst (ClickUp 86c777p5w, punkt 6)**

Alla tekniska buggar i prioritetslistan är avklarade i kod, så sessionen tog nästa
punkt i arkitektur-backloggen enligt beskrivningens ordning.

Läget innan: projektet skickade exakt två mail — verifiering och lösenordsåterställning
— och båda satt direkt i `src/lib/email.ts` med en SMTP-transport som byggdes på
modulnivå. Ingen fick alltså mail när de betalade för premium, beställde ett kort eller
när kortet skickades. Det är precis den sortens tystnad som blir supportärenden: kunden
har dragits 598 kr och har ingen kvittens på att något hänt.

**Två nya lager:**

- **`src/lib/mailer.ts`** — delad SMTP-transport (Strato), skapad lat i stället för vid
  import, med samma env-variabler som förut (`SMTP_*` med fallback till `STRATO_*`).
  Två funktioner: `sendMail()` som kastar, och `sendMailSafe()` som aldrig kastar.
- **`src/lib/notifications/`** — `templates.ts` (rena renderingsfunktioner, in med data
  → ut med `{subject, html, text}`) och `index.ts` med `sendSystemNotification(event)`
  som enda utgång. Både HTML- och textdel i varje mail.

`email.ts` är omskriven till att använda den delade transporten. Signaturerna på
`sendVerificationEmail` och `sendPasswordResetEmail` är oförändrade — inga anropsställen
behövde röras.

**Tre nya mail, inkopplade på sex ställen:**

1. *Premium är aktiverat* — Stripe-webhooken, `/api/stripe/verify-session`,
   `grantPremiumFromIap` (Apple IAP), premium-tillägget i `fulfillPhysicalCardOrder`
   och admins "ge premium". Texten är källspecifik: App Store-köpet nämner App Store,
   kortordern nämner kortordern, admin-gåvan nämner ingen betalning alls.
2. *Tack för din beställning* — vid orderskapande, med ordernummer, antal och summa.
3. *Din beställning är på väg* — när admin sätter status till SHIPPED, med
   aktiveringsinstruktion för kortet.

**Dubbletthantering utan migrering.** Det här var det svåraste i uppgiften.
`/api/stripe/verify-session` och Stripe-webhooken kan båda träffa *samma* premiumköp,
och admin kan klicka "markera som skickad" hur många gånger som helst. Alla ställen
läser därför tillståndet före skrivningen och mailar bara vid en faktisk övergång
(av → på, respektive → SHIPPED). Apple IAP var redan idempotent via unikt
`transactionId`. Ingen ny tabell, ingen migrering.

**Utskicken kan aldrig fälla ett flöde.** `sendSystemNotification` fångar allt: saknad
SMTP-konfiguration, ogiltig mottagare (gästbeställningar utan e-post) och sändningsfel
ger ett returvärde och en loggrad — aldrig ett kastat fel. En betalning eller en
orderuppdatering får inte se ut att misslyckas för att mailservern har en dålig dag.
Mailen skickas dessutom sist i respektive funktion, efter att databasen är skriven.

**En bugg hittad av testerna:** kundnamnet gick orört in i mailets HTML. Namnet kommer
från profilen eller från Stripes leveransuppgifter — alltså ett fält användaren själv
fyller i — så ett namn med `<script>` hamnade som markup i mailet. Nu escapas det.

**Tester:** 20 nya Vitest-tester i `src/lib/__tests__/notifications.test.ts`
(mallar, beloppsformatering, dubblettskydd, mottagarvalidering, HTML-escaping).
Totalt 114, alla gröna. `npm run lint` OK, `npx tsc --noEmit` OK (noll fel),
`npm run build` OK.

Manuell testchecklista utökad med avsnitt O i [[08 Testchecklista]].

### Återstår / nästa session

1. **[[08 Testchecklista]] är fortfarande inte körd** — nu 15 avsnitt (A–O). Inget av
   kodfixarna från session 1–6 är verifierat live. Det är fortfarande den enskilt
   största återstående risken inför lansering, och den växer för varje session.
2. **Systemmailen kräver att SMTP är konfigurerat i produktion.** Se frågan nedan.
3. **Arkitektur-backloggen (86c777p5w):** punkt 1, 2, 4, 5 och 6 är gjorda. Kvar:
   punkt 3 (profilversionering), punkt 7 (miljöseparation), punkt 8 (B2B-datamodell).
   Nästa i tur enligt beskrivningens ordning: punkt 7, miljöseparation — men den är
   till stor del en env-/Vercel-uppgift snarare än kod, så punkt 3 kan vara ett
   bättre val för en autonom session.
4. **Ramar och engångsköps-mallar** (86c74tjrn) — blockerat på obesvarade frågor.
5. **Apple Wallet-uppdatering** — blockerat, se session 5.

### Frågor till Oskar

- **Är SMTP satt i produktionsmiljön på Vercel?** De nya mailen använder samma
  variabler som verifieringsmailet (`SMTP_HOST`, `SMTP_USER`/`STRATO_SMTP_USER`,
  `SMTP_PASS`/`STRATO_SMTP_PASS`, ev. `SMTP_FROM`). Fungerar verifieringsmailet i
  produktion idag så fungerar även de nya. Jag rör inte env-variabler.
- **Ska kvitto/faktura bifogas orderbekräftelsen?** Just nu står ordernummer, antal
  och summa i mailtexten, men det är inget bokföringsunderlag. Stripe kan skicka egna
  kvitton — vill du ha det på, eller ska vi bygga ett eget kvitto? Hänger ihop med
  ClickUp-tasken om bokföringsrutin.
- **Vill du ha kopia till dig själv på nya ordrar?** Ett internt "ny order"-mail är
  fem rader till, men jag vet inte vilken adress som ska ta emot dem.
- Obesvarade frågor från session 1–5 står kvar: `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS` i
  produktion, vilka ramar som ska vara premium, vad "engångsköps-mallar" betyder,
  Apple Wallet-uppdatering, död kod (`/api/upload/profile-image`,
  `ProfileSettingsForm`), samt om kort ska sättas tillbaka till `UNCLAIMED` vid
  kontoradering.

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
