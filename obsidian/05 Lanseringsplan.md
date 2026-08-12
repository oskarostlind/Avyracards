---
skapad: 2026-08-10
---

# Lanseringsplan (utöver Apple-submission)

Allt öppet i ClickUp som inte är kod. Ordnat så att det som blockerar intäkter/submission kommer först. Kan köras parallellt med [[03 Plan – Apple Submission]].

## Spår A — Företag & ekonomi (blockerar skarpa intäkter)

1. **Starta enskild firma** → krävs för Stripe skarpt, Apple Paid Apps-avtal och fakturering. ([task](https://app.clickup.com/t/86c6qdj6c))
2. **F-skatt + momsregistrering** ([task](https://app.clickup.com/t/86c6rb421))
3. **Bankkonto** (företags-) → kopplas till Stripe payout + App Store Connect ([task](https://app.clickup.com/t/86c6rb47n))
4. **Bokföringsrutin** — välj verktyg (t.ex. Bokio/Fortnox), koppla Stripe-exporter ([task](https://app.clickup.com/t/86c6rb46g))
5. **Momsstruktur SE/EU/int.** — moms på kort (varor) vs prenumeration (digital tjänst, OSS?) ([task](https://app.clickup.com/t/86c6rbcy3))

> Obs: A1–A3 kan vara **hård blocker för IAP-intäkter** — Apple betalar inte ut utan komplett skatt-/bankinfo. Gör detta tidigt.

## Spår B — Juridik (bör vara klart före submission)

1. **GDPR-genomgång** — privacy policy (`/privacy`) uppdaterad: vilka data, laglig grund, radering (kopplar till 5.1.1(v)), cookies/analytics, registerförteckning ([task](https://app.clickup.com/t/86c6rbd4r))
2. **Returns & refunds policy** — ångerrätt 14 dagar EU för fysiska kort; IAP-återköp hanteras av Apple ([task](https://app.clickup.com/t/86c6rbczb))

## Spår C — Marknadsföring (parallellt, avgör lanseringens effekt)

1. **Sätt lanseringsdatum** — styr allt nedan ([task](https://app.clickup.com/t/86c6rbdg9))
2. **Tone of Voice + brandning klar** ([ToV](https://app.clickup.com/t/86c6rbxvb), [Brandning](https://app.clickup.com/t/86c6rbwzc))
3. **Webbcopy + produktbeskrivningar** — återanvänds till App Store-texterna! Gör före/ihop med Fas 2 i submission-planen ([task](https://app.clickup.com/t/86c6rbhy7))
4. **Byta demovideo på landningssidan** ([task](https://app.clickup.com/t/86c72txv9))
5. **TikTok-företagskonto klart** + **30-dagars contentplan** ([konto](https://app.clickup.com/t/86c7584w5), [plan](https://app.clickup.com/t/86c6rbfft))
6. **Ads Meta/TikTok** — starta först när appen är godkänd (länka till App Store) ([task](https://app.clickup.com/t/86c6rbh09))
7. **Ambassadörsprogram** — rabattkoderna finns redan i systemet ([task](https://app.clickup.com/t/86c6rbkf8))
8. **B2B: säljdeck + utskick till företag** ([deck](https://app.clickup.com/t/86c6rbjgw), [utskick](https://app.clickup.com/t/86c6rbdrh))

## Spår D — Teknik efter lansering

1. Google Wallet på Android ([task](https://app.clickup.com/t/86ca6yh4y))
2. Engångsköps-mallar + ramar i teman ([task](https://app.clickup.com/t/86c74tjrn))
3. Arkitektur-backloggen från "AI Rekommenderar": analytics-lager → rate limiting → feature-gating → wallet-lifecycle → resten ([task](https://app.clickup.com/t/86c777p5w))

## Föreslagen sekvens (ASAP-läge)

Vecka 1: Submission Fas 1–3 + Spår A1–A3 + Spår B — parallellt.
Vecka 2: Review-svar/fixar + Spår C1–C4.
Efter godkännande: sätt lanseringsdatum, kör Spår C5–C8, därefter Spår D.
