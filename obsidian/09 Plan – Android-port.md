# Plan – Android-port (Capacitor)

Mål: AvyraCards ska finnas på Google Play med **exakt samma UI och funktioner** som idag, utan att någon iOS- eller webbfunktion påverkas.

---

## Utgångsläge (verifierat i koden 2026-08-22)

- `capacitor.config.ts` har `server.url: 'https://avyracards.se'` → **iOS-appen är ett WebView-skal runt live-sajten**, inte en statisk bundle.
  → **Detta är nyckeln:** all UI/funktionalitet kommer från webben. En Android-port ärver den automatiskt. Vi bygger inget UI på nytt.
- `android/` finns inte. Bara `ios/`.
- Alla Capacitor-plugins vi använder har redan Android-stöd:

| Plugin | Android |
|---|---|
| `@capacitor/app`, `browser`, `share`, `splash-screen`, `push-notifications` | ✅ |
| `@capacitor-community/fcm` | ✅ (FCM är *native* på Android) |
| `@capacitor-community/stripe` | ✅ (Google Pay i stället för Apple Pay) |
| `@capgo/native-purchases` | ✅ (Google Play Billing) |
| `@capacitor-community/apple-sign-in` | ✅ (web-flow-fallback) |

- Plattformsdetektion finns redan: `useIsApp()` (Capacitor-bridge), `walletKindsForUserAgent()` (Apple vs Google Wallet).
- Google Wallet-endpoint (`/api/wallet/google`) finns redan och används.
- `@capacitor/ios` finns som dependency men inte `@capacitor/android`.

**Slutsats:** ~80 % av arbetet är redan gjort. Det som återstår är (1) generera Android-skalet, (2) göra iOS-specifik gating plattformsmedveten, (3) betalningar enligt Play-policy, (4) Android-specifika WebView-egenheter.

---

## Grundprincip: additivt, aldrig destruktivt

Regeln för hela porten:

> Ingen befintlig kodväg får ändra beteende. Vi lägger till en `android`-gren bredvid `ios`-grenen, aldrig i stället för.

Konkret:
- `isIosNativePaymentsEnabled()` behålls som den är. Vi lägger till `isAndroidNativePaymentsEnabled()`.
- Nuvarande `isApp === true` → antas idag implicit betyda iOS. Vi inför `usePlatform()` som returnerar `"web" | "ios" | "android"` och låter gamla anrop mappa till samma resultat som förut.
- Allt Android-specifikt bakom `NEXT_PUBLIC_ANDROID_*`-flaggor som defaultar till `false` → tills flaggan slås på är produktionen bit-för-bit identisk.
- Egen branch (`feat/android-port`), ingen merge till main förrän Play-intern testning är grön.

---

## Fas 0 – Förberedelse (ingen kodändring i src)

1. Skapa branch `feat/android-port` från nuvarande läge.
2. `npm i @capacitor/android`
3. `npx cap add android` → genererar `android/` (commit:as, precis som `ios/`).
4. Lägg `android/` i samma "genererad men committad"-kategori som `ios/` i CLAUDE.md.
5. Google Play Console: skapa app, package name `se.avyracards.app`, aktivera **Play App Signing**.
6. Firebase: lägg till Android-app i det befintliga projektet → `google-services.json` in i `android/app/`.

**Efter Fas 0 ska appen redan gå att bygga och köra på en Android-telefon och visa hela sajten.** Det är rimligt att verifiera detta innan vi rör en enda rad i `src/`.

---

## Fas 1 – Plattformsabstraktion (den enda refaktorn)

Ny fil `src/lib/native-platform.ts`:

```ts
export type NativePlatform = "web" | "ios" | "android";
export function getNativePlatform(): NativePlatform  // läser Capacitor.getPlatform()
```

Ny hook `src/hooks/useNativePlatform.ts` byggd på samma mönster som `useIsApp()`.

- `useIsApp()` **behålls oförändrad** – all befintlig kod fortsätter fungera.
- `src/lib/ios-native.ts` rörs inte. Ny parallellfil `src/lib/android-native.ts` för Android-flaggor/produkt-ID:n.
- Debug-loggen (`ios-native-runtime-debug.ts`) generaliseras *bakåtkompatibelt* till `native-runtime-debug` med `ios-*` som re-export, alternativt lämnas helt orörd och Android får en egen. **Rekommendation: lämna orörd i v1** – lägre risk, städas senare.

Risk: låg. Ingen befintlig branch ändras.

---

## Fas 2 – Betalningar (den svåraste biten)

Google Plays betalningspolicy speglar Apples, men inte identiskt:

| Vad | iOS idag | Android måste |
|---|---|---|
| **Premium-prenumeration** (digitalt) | Apple IAP | **Google Play Billing** – Stripe är inte tillåtet |
| **Fysiska NFC-kort** | Stripe/Apple Pay | **Stripe** – Play Billing är *förbjudet* för fysiska varor |

Det betyder:

**2a. Fysiska kort:** ingen ändring. Stripe-flödet i `order-view.tsx` fungerar som på webben. `@capacitor-community/stripe` kan lägga till Google Pay-knapp som bonus (valfritt, inte krav).

**2b. Premium via Play Billing:**
- `@capgo/native-purchases` används redan för iOS-IAP → samma API mot Play Billing. `IosIapPremiumButton` får en Android-syskonkomponent, `premium-checkout-form.tsx` väljer variant på `platform`.
- Serversidan behöver en Android-motsvarighet till `src/lib/apple-iap.ts`:
  - Verifiera köpet mot **Google Play Developer API** (`googleapis` finns redan installerat) med ett service account.
  - Prisma: nytt modell `GooglePlayTransaction` bredvid `AppleIapTransaction` (ingen ändring av befintlig tabell → migrationen är rent additiv).
  - **Real-time Developer Notifications (RTDN)** via Pub/Sub → ny endpoint `/api/webhooks/google-play` för förnyelser, uppsägningar och återbetalningar. Utan denna vet vi inte när ett abonnemang upphör.
- "Restore purchases"-knappen behöver en Android-variant (Play Billing: `queryPurchases`).
- Skapa prenumerationsprodukterna i Play Console med samma pris/period som App Store-produkterna.

Detta är den överlägset största posten. Uppskattning: 60–70 % av totala arbetstiden.

**2c. Fallback:** tills 2b är klart kan Android-appen köra samma mönster som `iapUnavailableInApp` gör idag – dölja premium-köp i appen och hänvisa till webben. Det gör att vi kan släppa Android *utan* premium först och lägga till det i v2. **Bra riskavlastning om du vill vara på Play snabbt.**

---

## Fas 3 – Inloggning

- **E-post/lösenord:** fungerar direkt, inget att göra.
- **Sign in with Apple:** knappen är idag gated på `isApp && isIosNativePaymentsEnabled()`. Med Fas 1 blir gaten `platform === "ios" && ...` → **knappen försvinner automatiskt på Android**, inget behöver dölja den manuellt. (Apple kräver bara Apple-login på Apple-plattformar.)
- **Google Sign-In:** inte ett Play-krav, men förväntat av användare på Android. Kan skjutas till v2.
- NextAuth-sessionen är cookie-baserad på `avyracards.se` → fungerar i Android WebView som den gör i WKWebView. Verifiera bara att `SameSite`/`Secure` beter sig lika.

---

## Fas 4 – Android-specifika WebView-egenheter

Punkter där Android WebView *skiljer sig* från WKWebView och kan bryta funktioner som fungerar på iOS:

1. **Nedladdningar (`.vcf`, `.pkpass`, Wallet-länkar).** Android WebView laddar **inte** ner filer per default – en `<a download>` gör tyst ingenting. Kräver en `DownloadListener` i `MainActivity.java`, eller att `vcard`/wallet-anropen går via `@capacitor/browser`. Berör `social-profile.tsx`, `business-profile.tsx`, `public-profile-card.tsx`.
   → **Detta är den vanligaste "allt fungerade på iOS men inte på Android"-fällan.** Prioritera.
2. **Hårdvaru-bakåtknappen.** Utan hantering stänger den appen mitt i ett flöde. Kräver `App.addListener('backButton', …)` → `window.history.back()`, stäng appen bara vid rot. Ny liten komponent `android-back-handler.tsx`, monteras bara när `platform === "android"`.
3. **Filuppladdning** (`avatar-uploader.tsx`, `image-uploader.tsx`, `file-upload-button.tsx`). Capacitor 8 hanterar `onShowFileChooser`, men kamera-/galleri-behörigheter måste deklareras i `AndroidManifest.xml`.
4. **Safe area / statusfält.** `navbar-client.tsx` använder `env(safe-area-inset-top)`. Android WebView exponerar detta först med `edge-to-edge` konfigurerat. Testa på en telefon med hålkamera – annars hamnar navbaren under statusfältet.
5. **Splash screen.** `SplashScreenManager` fungerar cross-platform; behöver bara Android-assets (`android/app/src/main/res/drawable*`).
6. **App Links / deep links.** `/c/[cardCode]` bör öppna appen vid NFC-tapp: `intent-filter` med `autoVerify="true"` + `/.well-known/assetlinks.json` på avyracards.se (motsvarigheten till Apples AASA-fil).
7. **`target="_blank"`.** Kommentaren i `public-profile-card.tsx` nämner att detta öppnar systemwebbläsaren i WebView – verifiera samma beteende på Android, annars `@capacitor/browser`.

---

## Fas 5 – Assets, build & release

- Ikoner + splash: `@capacitor/assets` genererar från befintliga `assets/`.
- Adaptive icon (Android-specifikt format, för/bakgrundslager).
- Versionshantering: nytt `scripts/bump-android-build.mjs` som speglar `bump-ios-build.mjs` men skriver `versionCode` i `android/app/build.gradle`. Nya npm-scripts `android:bump` / `android:release`. **Rör inte de befintliga iOS-scripten.**
- CI: Appflow bygger idag iOS. Android kan byggas i Appflow eller i GitHub Actions (billigare, Android kräver ingen Mac).
- Play Console: Data safety-formulär, integritetspolicy-länk, målgrupp, innehållsklassificering.
- Målnivå: `targetSdk 35` (Play-krav 2026).

---

## Fas 6 – Verifiering innan release

- [ ] Ingen visuell skillnad mot iOS på samma sida (sida-vid-sida-screenshots).
- [ ] Alla flöden: registrering → onboarding → tema → länkar → publik profil → korttapp → aktivering.
- [ ] vCard-nedladdning fungerar från Android-appen (inte bara mobilwebben).
- [ ] Google Wallet-pass sparas.
- [ ] Push-notis tas emot.
- [ ] Bakåtknappen beter sig rätt i alla nivåer.
- [ ] Stripe-köp av fysiskt kort går igenom.
- [ ] `npm run build`, `npm run lint`, `tsc --noEmit`, `npx vitest run` gröna.
- [ ] iOS-appen byggd från samma branch är *oförändrad* (regressionstest – detta är hela poängen).

---

## Ordningsförslag

| Steg | Innehåll | Ger |
|---|---|---|
| 1 | Fas 0 | Körbar Android-app med hela UI:t – bevis på att grundidén håller |
| 2 | Fas 4 | Alla befintliga funktioner fungerar faktiskt på Android |
| 3 | Fas 1 + 3 | Ren plattformslogik, Apple-knappen borta på Android |
| 4 | Fas 5 | Släppbar intern testversion på Play |
| 5 | Fas 2 | Premium via Play Billing |

Steg 1–4 ger en Android-app som gör allt utom att sälja premium in-app. Steg 5 kan ske parallellt eller i en v1.1.

---

## Öppna frågor att besluta

1. **Premium i v1 eller v2?** Släppa utan in-app-premium (snabbt) eller vänta på Play Billing (komplett)?
2. **Google Sign-In** i v1 eller senare?
3. **Build-pipeline:** Appflow (samma som iOS) eller GitHub Actions för Android?
4. **Play Billing-verifiering:** service account + RTDN kräver GCP-konfiguration – vem sätter upp Pub/Sub?
