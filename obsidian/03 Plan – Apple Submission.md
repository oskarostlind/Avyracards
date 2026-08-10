---
skapad: 2026-08-10
mål: App Store-submission så fort som möjligt
nuläge: TestFlight fungerar, aldrig submittat
---

# Plan — Apple Submission

Kortaste vägen till inskickad app. Fas 1–3 är kritisk väg (~1 vecka fokuserat arbete). Fas 4–5 ligger i [[05 Lanseringsplan]] och kan köras parallellt/efteråt.

## Fas 1 — Review-blockers i appen (1–2 dagar)

- [ ] **1.1 Verifiera IAP-vägen i produktionsappen.** `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS` ska vara PÅ i den version reviewern ser. Premium får ALDRIG gå via Stripe-checkout inne i iOS-appen (Guideline 3.1.1 = vanligaste avslaget). Fysiska kort via Stripe är OK (3.1.3(e) fysiska varor).
- [ ] **1.2 Kontoradering i appen.** Krav 5.1.1(v): konto som kan skapas i appen måste kunna raderas i appen. Kolla att `/api/account` DELETE har synligt UI i inställningar och att flödet funkar i iOS-skalet.
- [ ] **1.3 Fixa profilbildsbuggen** ([ClickUp](https://app.clickup.com/t/86c9nv6uw)) — kärnflöde som reviewern troligen rör.
- [ ] **1.4 WebView-app-städning (4.2-risk, se [[04 Apple-krav & risker]]).** Verifiera i TestFlight: ingen browser-chrome, splash funkar, vettig offline-/felskärm när nätet saknas, externa länkar öppnas rätt (in-app browser/Safari), Apple Sign-In + push + IAP + Wallet fungerar — det är de native-funktioner som motiverar att appen inte "bara är en hemsida".
- [ ] **1.5 Regressionstest enligt [Kontrollera funktionalitet](https://app.clickup.com/t/86c6rbe2j):** registrera konto, logga in (e-post + Apple), onboarding, lägga länkar, byta tema, publik profil, spara kontakt, Wallet-pass, beställa kort (test), köpa premium via IAP (sandbox), avsluta prenumeration, radera konto.

## Fas 2 — App Store Connect-paketet (1–2 dagar, kräver ingen kod)

- [ ] **2.1 IAP-produkter i ASC:** prenumerationsgrupp, pris, lokaliserad beskrivning; skicka in IAP:n för review ihop med appen.
- [ ] **2.2 App-listing:** namn, undertitel, beskrivning, nyckelord, kategori (Business/Lifestyle), support-URL (`/contact`), marketing-URL, privacy policy-URL (`/privacy` — verifiera att den är aktuell, se GDPR-tasken).
- [ ] **2.3 Screenshots:** 6,9" + 6,5" iPhone (obligatoriskt), gärna med svensk text som matchar appen. Dashboard, publik profil, tema-editor, Wallet, kortbeställning.
- [ ] **2.4 Privacy nutrition labels:** deklarera insamling — e-post, namn, köp, användnings-/analyticsdata, foton (profilbild). Måste matcha verkligheten.
- [ ] **2.5 Age rating-formulär** (blir 4+/12+ beroende på svar) och **export compliance** (standard HTTPS → exempt).
- [ ] **2.6 Demo-konto till App Review** med premium aktiverat + **review notes** som förklarar NFC-korten (reviewern har inget fysiskt kort — beskriv `/c/`-flödet, ev. kort demovideo).

## Fas 3 — Bygg & skicka in (1 dag + väntetid)

- [ ] **3.1** `npm run ios:release` (bump + cap sync) → Appflow-bygge → TestFlight.
- [ ] **3.2** Sista rök-test på TestFlight-bygget (Fas 1.5-listan i kortform).
- [ ] **3.3** Koppla bygget till listingen, svara på compliance-frågor, **Submit for Review**.
- [ ] **3.4** Review tar normalt 24–48 h. Vid avslag: läs motiveringen, fixa, svara i Resolution Center — dokumentera i [[06 Beslutslogg]].

## Beroenden & risker på kritiska vägen

1. **3.1.1 (IAP)** och **4.2 (minimum functionality)** är de två troligaste avslagen — se [[04 Apple-krav & risker]].
2. Apple Developer-kontot måste ha aktuellt medlemskap + skattavtal/bankinfo ifyllt i ASC (annars går betald IAP inte att aktivera) — hänger ihop med [Bankkonto](https://app.clickup.com/t/86c6rb47n)/[enskild firma](https://app.clickup.com/t/86c6qdj6c) i [[05 Lanseringsplan]]. **Kolla detta först — kan vara den verkliga blockern.**
3. Privacy policy + villkor bör vara juridiskt OK innan submission (GDPR-tasken) — Apple länkar dit publikt.
