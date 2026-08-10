---
skapad: 2026-08-10
---

# Beslutslogg

Logga beslut här med datum + varför, så slipper vi återuppfinna resonemang.

| Datum | Beslut | Varför |
|---|---|---|
| 2026-08-10 | Obsidian-vault skapad i repot (`obsidian/`) | Delad "hjärna" för Oskar + Claude mellan sessioner |
| 2026-08-10 | Plan: submission först, marknadsföring parallellt | TestFlight funkar redan; kortaste väg till App Store prioriteras |
| 2026-08-10 | Google Wallet-Android-bugg nedprioriterad | Blockerar inte Apple-submission |
| 2026-08-10 | "AI Rekommenderar"-arkitekturlistan → efter lansering | Osynlig för användare, inget App Review-krav |
| 2026-08-10 | Autonom schemalagd byggsession skapad (var 4:e timme, ~30 min/session) | Oskar granskar i efterhand; sessionerna klonar från GitHub, pushar till main → Vercel autodeploy. Trigger-ID: trig_01Aw6uphpBBKQS8117pDQnwD |
| 2026-08-10 | Transaktionsmail bör flyttas till Resend (avyracards.se ej verifierad där ännu) | Resend Pro finns nu; bättre leverans + spårning än Strato-SMTP |

## Blockers för autonoma sessioner

- [ ] Repot `oskarostlind/Avyracards` måste läggas till som källa/auktoriserat repo för Claude-sessioner (git-proxyn nekar annars klonen) — Oskar gör detta i GitHub-kopplingen.
- [ ] Lokala ocommittade ändringar (12 filer + `obsidian/` + `CLAUDE.md`) måste committas och pushas en gång från Oskars dator, annars jobbar molnsessionerna på gammal kod.

## Öppna frågor

- [ ] Är Apple Developer-kontots Paid Apps-avtal + bank/skatt komplett i App Store Connect? (Kan vara verklig blocker för IAP)
- [ ] Ska `obsidian/`-mappen committas i git eller .gitignore:as?
- [ ] Vilket lanseringsdatum siktar vi på efter godkännande?
