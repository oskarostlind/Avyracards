---
skapad: 2026-08-10
källa: ClickUp workspace 90152016760, lista "To do fram till lansering" (901518088048)
---

# ClickUp-läget (2026-08-10)

Totalt ~139 tasks. **~109 klara, ~30 öppna.** Nästan all kärnfunktionalitet i appen är klarmarkerad — det som återstår är några tekniska småsaker plus affär/juridik/marknadsföring.

## Öppna — Teknik (blockerar eller påverkar submission)

| Task | Kommentar |
|---|---|
| [gick ej att byta profilbild](https://app.clickup.com/t/86c9nv6uw) | Bugg — bör fixas före submission (syns i review) |
| [Kontrollera funktionalitet!](https://app.clickup.com/t/86c6rbe2j) | = full regressionstest före lansering |
| [byta video till faktiskt demo](https://app.clickup.com/t/86c72txv9) | Landningssidan — inte App Store-blocker |
| [går ej med Google Wallet på Android](https://app.clickup.com/t/86ca6yh4y) | Påverkar EJ Apple-submission |
| [Teman: engångsköps-mallar + ramar](https://app.clickup.com/t/86c74tjrn) | Ny feature — kan släppas efter v1 |
| [AI Rekommenderar](https://app.clickup.com/t/86c777p5w) | Stort arkitektur-backlog (se nedan) — efter lansering |

### "AI Rekommenderar"-tasken (arkitektur-backlog, ej submission-krav)
Analytics-/eventlager, rate limiting & botskydd, feature-gating-system (`canAccess`), wallet-pass-lifecycle, profilversionering/rollback, systemmail (order/premium), miljöseparation, B2B-datamodell (organization_id). Prioritet: efter lansering, i den ordningen.

## Öppna — Juridik & Ekonomi

- [GDPR-genomgång](https://app.clickup.com/t/86c6rbd4r) (Oskar)
- [Returns & refunds policy](https://app.clickup.com/t/86c6rbczb)
- [Momsstruktur SE/EU/internationellt](https://app.clickup.com/t/86c6rbcy3)
- [Starta enskild firma](https://app.clickup.com/t/86c6qdj6c) · [F-skatt & momsreg.](https://app.clickup.com/t/86c6rb421) · [Bankkonto](https://app.clickup.com/t/86c6rb47n) · [Bokföringsrutin](https://app.clickup.com/t/86c6rb46g)

## Öppna — Marknadsföring & lansering

- [Sätt ett lanseringsdatum!](https://app.clickup.com/t/86c6rbdg9)
- [Tone of Voice](https://app.clickup.com/t/86c6rbxvb) · [Brandning](https://app.clickup.com/t/86c6rbwzc) (visuell identitet, namn, domän = klara)
- [Webbcopy + produktbeskrivningar](https://app.clickup.com/t/86c6rbhy7)
- [30-dagars TikTok/IG-contentplan](https://app.clickup.com/t/86c6rbfft) · [Ads Meta/TikTok](https://app.clickup.com/t/86c6rbh09)
- [Ambassadörsprogram](https://app.clickup.com/t/86c6rbkf8) (rabattkoder finns redan)
- [Säljdeck B2B](https://app.clickup.com/t/86c6rbjgw) · [Utskick till företag](https://app.clickup.com/t/86c6rbdrh)
- [TikTok-företagskonto](https://app.clickup.com/t/86c7584w5) · [Sociala medier](https://app.clickup.com/t/86c7584t7)
- [AI AGENT (beskrivning i task)](https://app.clickup.com/t/86c6rc0jb)

## Nyligen klart (viktigast)

- ✅ In-app payment / native Apple Pay-IAP på iOS (juni–juli 2026)
- ✅ Villkor för köp i /shop, premium-preview-fixar
- ✅ Stripe live-nycklar, hela köpflödet, admin-PIM, rabattkoder
- ✅ Apple/Google Wallet-pass, "spara kontakt", statistik, teman, onboarding
