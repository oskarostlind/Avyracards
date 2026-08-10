---
skapad: 2026-08-10
uppdaterad: 2026-08-10
clickup: 86c6rbe2j
---

# Testchecklista — manuellt regressionstest

Körs på **TestFlight-bygget** innan submission, och på **avyracards.se** efter varje produktionsdeploy av något större. Automatiska tester: `npm test` (Vitest, se [[07 Bygglogg]]).

Markera med datum + byggnummer när listan körts igenom.

## A. Konto & auth

- [ ] Registrera nytt konto med e-post + lösenord
- [ ] Verifieringsmail kommer fram (om aktiverat)
- [ ] Logga ut och in igen
- [ ] Logga in med Apple (endast iOS-appen — ska vara ENDA metoden i native-läge)
- [ ] Glömt lösenord → återställningsmail → nytt lösenord fungerar
- [ ] Byt användarnamn i inställningar (upptaget namn ska ge tydligt fel)
- [ ] **Radera konto** (Inställningar → Radera konto → bekräfta två gånger) → utloggad, profil-URL ger 404. *App Review 5.1.1(v) — måste fungera i appen.*

## B. Onboarding & profil

- [ ] Onboarding-flödet går att slutföra för ny användare
- [ ] Sätt namn, bio, telefon, kontakt-mail → sparas efter reload
- [ ] **Byt profilbild** (ClickUp 86c9nv6uw): välj bild → beskär → Spara bild → bilden syns direkt i formuläret UTAN att man klickar "Spara ändringar", och finns kvar efter reload
- [ ] Byt profilbild från iPhone-kamerarullen (HEIC ska ge tydligt felmeddelande, JPG/PNG ska fungera)
- [ ] För stor bild (>12 MB) ger tydligt fel, inte en tyst krasch
- [ ] Business-läge: byt business-avatar och företagslogga — samma direktsparande
- [ ] Växla mellan SOCIAL och BUSINESS → rätt fält och länkar visas

## C. Länkar

- [ ] Lägg till länk, redigera, ändra ordning, ta bort
- [ ] Inaktivera länk → försvinner från publik profil
- [ ] Länk i BUSINESS-läge syns inte i SOCIAL-läge och tvärtom

## D. Teman

- [ ] Byt tema → syns på publik profil
- [ ] Premium-tema som gratisanvändare → uppgraderingsmodal (i iOS-appen ska den leda till App Store-köp, inte Stripe)
- [ ] Egen bakgrundsbild laddas upp och sparas

## E. Publik profil & kontakt

- [ ] `avyracards.se/u/<username>` laddar i mobil och desktop
- [ ] Profilbild, namn, headline och länkar renderas rätt
- [ ] "Spara kontakt" laddar ner en vCard som importeras korrekt i iOS Kontakter
- [ ] Ring-/maila-knappar öppnar rätt app
- [ ] Redirect-läge (om påslaget) skickar vidare till rätt länk

## F. Wallet

- [ ] Apple Wallet-pass går att lägga till från iPhone
- [ ] Google Wallet-pass går att lägga till från Android *(känd bugg — ClickUp 86ca6yh4y)*
- [ ] Passet öppnar rätt profil-URL

## G. Kortbeställning (fysiska varor — Stripe är OK även i appen)

- [ ] Välj variant, antal, material, design → pris uppdateras
- [ ] Egen bild till metallkort laddas upp (+100 kr syns i totalen)
- [ ] Webb: "Gå till kassan" → Stripe → testbetalning → orderbekräftelse
- [ ] iOS-appen: "Fortsätt till betalning" → **Apple Pay**, inte Stripe-webbkassa
- [ ] Order dyker upp i admin med rätt status
- [ ] Slut i lager → knappen är låst

## H. Premium (App Review 3.1.1 — kritiskt)

- [ ] **I iOS-appen syns INGEN Stripe-checkout för premium någonstans** — kolla `/checkout/premium`, uppgraderingsmodalen i temaeditorn, analytics-vyn och billing-vyn
- [ ] iOS: köp månadspremium via IAP i sandbox → premium aktiveras direkt
- [ ] iOS: kortbeställning med "Pro (6 mån premium)" → premium köps via App Store FÖRST, därefter Apple Pay för kortet
- [ ] iOS: "Återställ köp" fungerar för användare som redan har prenumeration
- [ ] Webb: premium via Stripe fungerar fortfarande
- [ ] Avsluta prenumeration (iOS: via App Store-inställningar; webb: via kundportal) → premiumfunktioner låses

## I. Kortclaim (NFC)

- [ ] `/c/<cardCode>` för ett oclaimat kort → claim-flöde → kortet kopplas till kontot
- [ ] Samma kort igen → kan inte claimas två gånger
- [ ] Felaktig kod → tydligt fel, ingen krasch
- [ ] Claimat kort → redirect till ägarens profil

## J. Appen som app (4.2-risk)

- [ ] Ingen browser-chrome eller adressfält syns
- [ ] Splash-skärmen visas och försvinner
- [ ] Flygplansläge → vettig felskärm, inte Safaris "kan inte öppna sidan"
- [ ] Externa länkar öppnas i in-app-browser/Safari, inte i appens webview
- [ ] Push-notis tas emot
- [ ] Djuplänk från Wallet-pass öppnar appen

## K. Efter deploy till produktion

- [ ] `avyracards.se` svarar 200
- [ ] Ny användare kan registrera sig
- [ ] `/privacy` och `/terms` laddar (Apple länkar publikt hit)
- [ ] Inga nya runtime-fel i Vercel-loggen första 15 minuterna
