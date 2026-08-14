# App Privacy — så här ska frågeformuläret besvaras

Måste matcha `ios/App/App/PrivacyInfo.xcprivacy` exakt. Klicka "Get Started" på
App Privacy-sidan och svara enligt nedan.

**Övergripande:** Ja, appen samlar in data. **Ingen** datatyp används för spårning
(Tracking = Nej genomgående), så ATT-prompt krävs inte.

| Datatyp | Kategori i formuläret | Syfte | Kopplad till identitet | Spårning |
|---|---|---|---|---|
| E-postadress | Contact Info → Email Address | App Functionality | Ja | Nej |
| Namn | Contact Info → Name | App Functionality | Ja | Nej |
| Telefonnummer | Contact Info → Phone Number | App Functionality | Ja | Nej |
| Fysisk adress | Contact Info → Physical Address | App Functionality | Ja | Nej |
| Foton | User Content → Photos or Videos | App Functionality | Ja | Nej |
| Användar-ID | Identifiers → User ID | App Functionality | Ja | Nej |
| Köphistorik | Purchases → Purchase History | App Functionality | Ja | Nej |
| Produktinteraktion | Usage Data → Product Interaction | Analytics + App Functionality | Ja | Nej |
| Grov plats | Location → Coarse Location | Analytics | Ja | Nej |

## Varför varje post finns

- **E-post, namn, telefon** — kontouppgifter och det som visas på visitkortet.
- **Fysisk adress** — leveransadress vid beställning av fysiskt NFC-kort. Sparas på `Order`.
- **Foton** — profilbild och egen kortdesign, laddas upp av användaren.
- **Användar-ID** — kontots interna id, används i statistiken.
- **Köphistorik** — premiumprenumeration och kortorder.
- **Produktinteraktion** — profilvisningar och länkklick i statistiken.
- **Grov plats** — land och stad per profilvisning i statistiken. Härleds ur IP,
  men Apple räknar det som grov platsdata.

## Vad som INTE ska kryssas i

- **Betalningsinformation** — kortuppgifter hanteras av Stripe på deras egen sida.
  Appen sparar bara ett kund-id, aldrig kortdata.
- **Kontakter, hälsa, ekonomi, sökhistorik, känsliga uppgifter** — samlas inte in.
- **Diagnostik/kraschdata** — inget kraschrapporterings-SDK är inbyggt.
- **Reklamdata** — annonserna är borttagna ur appen.

## Efter ifyllnad

Klicka **Publish**. Etiketterna visas sedan på produktsidan.
