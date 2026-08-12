# App Review-anteckningar — AvyraCards iOS

Underlag för App Store Connect ("App Review Information" → Notes) och för
checklistan inför submission. Uppdatera när något av nedanstående ändras.

---

## 1. Demokonto (obligatoriskt — appen kräver inloggning)

Granskaren kommer inte längre än startsidan utan konto. Fyll i under
*App Review Information → Sign-In Information*:

| Fält | Värde |
|---|---|
| Användarnamn | `appreview@avyracards.se` |
| Lösenord | *(sätt ett fast lösenord och rotera inte det under review)* |

Kontot ska ha:
- verifierad e-post (annars fastnar granskaren i verifieringssteget)
- `isPremium = true` så att premiumvyerna går att granska utan köp
- minst en publik profil med några länkar, så att `/u/[username]` inte är tom
- ett claimat kort, så att kortvyn inte är tom

## 2. Fysiska varor vs digitalt innehåll (3.1.1 / 3.1.3)

Appen har två separata betalflöden. Skriv detta i review notes:

> AvyraCards sells two different things. **Physical NFC cards** are shipped
> goods and are paid with Apple Pay / card via Stripe, which is allowed under
> guideline 3.1.3(e). **Premium**, which unlocks digital features in the app,
> is sold exclusively through Apple In-App Purchase. There is no way to buy
> Premium inside the app other than IAP, and no link out to an external
> purchase flow for digital content.

Verifiera före submission:
- `NEXT_PUBLIC_IOS_NATIVE_PAYMENTS=true` i Vercels produktionsmiljö
- IAP-produkterna finns och är "Ready to Submit" i App Store Connect
- `APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_IAP_PRIVATE_KEY`,
  `APPLE_IAP_PREMIUM_MONTHLY`, `APPLE_IAP_PREMIUM_6MO` är satta
- "Återställ köp" fungerar med ett Apple-ID som redan har köpt

Koden faller **inte** tillbaka på Stripe i appen: när
`NEXT_PUBLIC_IOS_NATIVE_PAYMENTS` saknas visas ett meddelande om att premium
inte kan köpas i appen, aldrig en Stripe-checkout.

## 3. Användarskapat innehåll (1.2)

Publika profiler (`/u/[användarnamn]`) innehåller användarskapat innehåll.
Så här uppfylls guideline 1.2:

| Krav | Var |
|---|---|
| Villkor som förbjuder stötande innehåll | `/terms` §12 + accepteras vid registrering |
| Rapportera innehåll | "Rapportera profil" i foten av varje publik profil, samt `/report` |
| Blockera användare | "Blockera" i foten av varje publik profil |
| Publicerad kontaktväg | `kontakt@avyracards.se` i sidfoten, på `/contact` och i rapportdialogen |
| Åtgärd inom 24 timmar | Admin → Moderation (`/admin/reports`), avstängning döljer profilen publikt |

Formulering till review notes:

> User profiles are user-generated content. Every public profile has a visible
> "Report" and "Block" control in the footer. Reports go to a moderation queue
> that is reviewed within 24 hours; our terms of use have a zero-tolerance
> clause for objectionable content and accounts that violate it are suspended,
> which immediately removes the profile from public view.

## 4. Kontoradering (5.1.1(v))

Konto → Inställningar → *Radera konto* → "Radera mitt konto".
Raderingen tar bort användaren i databasen (kaskad mot länkar, statistik,
revisioner), frigör fysiska kort för ny aktivering, markerar Google
Wallet-passet som utgånget och återkallar Sign in with Apple-kopplingen mot
Apples `auth/revoke` (TN3194).

## 5. WebView-wrappern (4.2)

Appen är en Capacitor-wrapper runt avyracards.se. Motivera minimum
functionality med den nativa funktionaliteten:

> The app is not a repackaged website: it uses Sign in with Apple, native
> In-App Purchase, push notifications, Apple Wallet passes, the camera for
> profile photos, and it is the companion app for our physical NFC cards —
> tapping a card opens the profile in the app.

Kvarstående risk: om nätverket är nere visas ingen offline-vy. Testa appen på
dålig uppkoppling före submission.

## 6. Innan varje uppladdning

- [ ] `npm run ios:bump` (görs manuellt, aldrig av automatiska sessioner)
- [ ] `npx tsc --noEmit` och `npm run lint` (bygget döljer typ- och lintfel)
- [ ] `npm test`
- [ ] `NEXT_PUBLIC_IOS_DEBUG` är **inte** `true` i produktion
- [ ] Screenshots visar verkliga appvyer, inte splash/mockups
- [ ] Support-URL och privacy-URL i App Store Connect svarar 200
