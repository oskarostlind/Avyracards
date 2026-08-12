---
skapad: 2026-08-10
---

# Apple-krav & risker

De guidelines som är relevanta för AvyraCards, med riskbedömning. (Verifierade mot aktuella App Review Guidelines aug 2026.)

## 🔴 Störst risk

### 3.1.1 — In-App Purchase för digitalt innehåll
Premiumprenumerationen är digital → **måste** säljas via Apples IAP i appen. Stripe-checkout får inte visas/länkas för premium i iOS-appen (inte ens en "köp på webben"-knapp utan godkänt undantag). Fysiska NFC-kort får däremot säljas med Stripe (3.1.3(e)).
**Läge:** Native IAP är byggd (`@capgo/native-purchases`, klarmarkerad i ClickUp). Verifiera flaggan + att alla premium-CTA:er i appen går till IAP.

### 4.2 — Minimum functionality (WebView-wrapper)
Appen laddar avyracards.se via `server.url` — klassisk grund för 4.2-avslag om appen upplevs som "bara en webbsida".
**Motargument som ska synas/fungera:** Apple Sign-In (native), push-notiser, native IAP, Apple Wallet-integration, NFC-kortkoppling. App-lik känsla: splash, ingen adressfält/chrome, offline-felhantering, inga döda "webbiga" element (cookie-banner i appen? — överväg att dölja för native).
**Fallback vid avslag:** peka på native-funktionerna i Resolution Center; långsiktigt kan mer flyttas in i bundlen.

## 🟡 Måste vara på plats (lätt att missa)

- **5.1.1(v) Kontoradering:** kan skapa konto i appen → måste kunna radera kontot helt i appen (inte bara "mejla oss").
- **4.8 Login-tjänster:** appen har Apple-login redan → kravet uppfyllt (gäller när tredjepartslogin finns; e-post/lösenord ensamt triggar det inte).
- **Privacy nutrition labels** i ASC måste matcha faktisk datainsamling (analytics!, profilbilder, köp).
- **5.1.1 Permission-strängar:** alla Info.plist-beskrivningar (push, ev. kamera/foton för profilbild) ska förklara varför.
- **Demo-konto** till review är i praktiken obligatoriskt när inloggning krävs.
- **Prenumerationsvillkor:** pris, period, auto-förnyelse måste framgå i appen vid köp + länk till villkor och privacy policy i listingen.

## 🟢 Låg risk / notering

- **Skatt/bank i ASC:** Paid Apps-avtal, bankkonto och skatteuppgifter måste vara klara innan IAP kan säljas skarpt — knyter an till enskild firma-tasken.
- **Export compliance:** standard-HTTPS → "exempt", kryssas i vid submission.
- **Age rating:** inga känsliga kategorier → låg rating, snabbt formulär.
- **EU DSA trader-status:** som EU-utvecklare med betalapp krävs verifierad trader-info (adress, e-post, telefon) i ASC — visas publikt i EU-butiken.

## Källor

- [MobiLoud — WebView apps & App Store guidelines](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper)
- [Code2Native — Fix App Store rejection 4.2](https://code2native.com/blog/fix-app-store-rejection-42-webview)
- [Apple — account deletion requirement](https://developer.apple.com/news/?id=i71db0mv)
- [TermsFeed — in-app account deletion](https://www.termsfeed.com/blog/apple-requirement-in-app-deletion-accounts/)
- [Lexogrine — App Store review 2026](https://lexogrine.com/blog/apple-app-store-review-requirements-2026)
