---
skapad: 2026-09-24
uppdaterad: 2026-09-25
---

# SEO & organisk tillväxt — avyracards.se

Källa för allt som rör hur sajten hittas organiskt. Byggd 2026-09-24 enligt playbooken *organisk-tillväxt* (mät → teknisk grund → svaga SERP:ar → handskrivet innehåll → Search Console). Se även [[11 Apple-design-granskning]] och [[05 Lanseringsplan]].

## 0. Läget innan (verifierat med curl mot produktion 2026-09-24)

| Kontroll | Resultat | Konsekvens |
|---|---|---|
| `/robots.txt` | **404** | Inga regler, dashboard/admin öppna för crawl |
| `/sitemap.xml` | **404** | Google har inget att utgå från |
| `<title>` | `AvyraCards` (10 tecken) på **alla** 12 publika sidor | Noll sökord, duplicerade titlar |
| Meta description | Samma 38 tecken överallt: "Digital NFC-baserad visitkortslösning" | Ingen sida säger vad den handlar om |
| Canonical | Saknas på alla sidor | — |
| `www.avyracards.se` | Svarar **200** med samma innehåll som apex | Två kopior av hela sajten i indexet |
| JSON-LD | 0 block | Inga rich results, ingen FAQ i SERP |
| Länk till App Store | **0** på hela sajten (grep på apps.apple.com = 0 träffar) | Webben har aldrig kunnat ge en installation → "Web Referrer 0" i ASC |
| `/u/[username]` | Titel `AvyraCards`, ingen beskrivning, ingen OG-bild per profil | Delade profiler ser likadana ut överallt |
| Startsidan | h1 ✓, 5 h2 ✓, 14 interna länkar ✓ (klientkomponenten SSR:as ändå) | Inte samma tomma-HTML-bugg som nextwatch |
| `ads.txt` | Finns kvar med AdSense-pub-id | Ofarligt men dött (annonser togs bort 12 aug) |
| TTFB | 0,7–0,8 s | OK för Vercel iad1 → SE; Core Web Vitals omätt |

**Audit-betyg innan: 31/100** (kritiskt). Startsidan i sig är hyfsat byggd — det är allt runt omkring som saknades.

App Store: **AvyraCards 2.0 är live sedan 21 aug 2026** (id 6760271330), 0 betyg, kategori Business, men listningen har **bara EN-lokalisering** med svensk text i — samma ASO-fel som Nextwatch hade.

## 1. Vad som byggdes 2026-09-24 (ej committat — granska och committa själv)

Alla ändringar ligger i working tree. `npx tsc --noEmit` = grön. `next lint`/vitest går inte att köra på device-VM:en (kända begränsningar) — **Vercels preview-deploy är den riktiga verifieringen.**

| Fil | Vad |
|---|---|
| `src/lib/seo.ts` | `SITE_URL` (apex, hårdkodat), `appStoreUrl(campaign)`, `PUBLIC_ROUTES`, `PRIVATE_PATHS` |
| `src/app/robots.ts` | Tillåt allt utom api/admin/dashboard/profile/checkout/activate/c/report m.fl. |
| `src/app/sitemap.ts` | De 10 statiska publika sidorna. Profiler listas medvetet inte |
| `src/app/layout.tsx` | `generateMetadata` på rätt språk: title-template `%s \| AvyraCards`, metadataBase, OG siteName/locale, Twitter card |
| `src/lib/seo-metadata.ts` | `pageMetadata()` — titel, beskrivning, canonical, OG, ev. Smart App Banner per sida |
| `src/lib/seo-schema.ts` + `src/components/seo/json-ld.tsx` | Organization, WebSite, MobileApplication, FAQPage (startsidan), WebPage (undersidor) |
| `src/app/page.tsx`, `social/page.tsx`, `business/page.tsx` | Nu **serverskal** med metadata + JSON-LD; klientvyerna flyttade till `src/components/landing/{home,social,business}-view.tsx` |
| `get-started`, `order`, `contact`, `privacy`, `terms`, `login`, `register` | `generateMetadata` via `pageMetadata` (login = noindex) |
| `src/app/u/[username]/page.tsx` | `generateMetadata`: namn i titeln, rubrik/bio som beskrivning, avatar som OG-bild, canonical utan preview-params. **Noindex** om profilen är tom (ingen bio/rubrik och 0 aktiva länkar), avstängd eller preview |
| `src/components/app-store-link.tsx` | App Store-länk med kampanjkod, döljs i appen men finns i serverns HTML |
| `src/components/footer.tsx` | + Länk i bio, Beställ NFC-kort, App Store (`ct=web-footer`) |
| `home-view.tsx` | App Store-länk under trust-raden i hero (`ct=web-home-hero`) |
| `next.config.mjs` | `www.avyracards.se/* → 308 → avyracards.se/*` |
| `src/i18n/messages/{sv,en}.ts` | Nytt block `seo.*` + `footer.socialProduct/orderCard` |
| `src/middleware.ts` | Matchern undantar filer med ändelse (robots/sitemap/verifieringsfil/bilder) |
| `src/app/globals.css` | `prefers-reduced-motion` + `prefers-reduced-transparency` (se [[11 Apple-design-granskning]]) |

Titlarna är 41–47 tecken **före** suffixet (13 tecken), så inget kapas i SERP.

Smart App Banner (`apple-itunes-app`) visas i Safari på `/`, `/social`, `/business`, `/get-started`, `/order` — **inte** på profiler, där mottagaren inte behöver appen.

### Status 2026-09-25 00:10 — LIVE och verifierat
- Deployat till prod (Oskar pushade HEAD:main). Verifierat med curl: robots.txt 200, sitemap.xml 200 med 10 `<loc>`, www → 308 → apex, unika titlar på alla sidor, `/login` noindex, `/u/nora` = "Nora Lindqvist – digitalt visitkort | AvyraCards".
- **Search Console uppsatt** (Claude i Oskars Chrome): property `https://avyracards.se/` (Webbadressprefix), verifierad med HTML-fil `public/google5da6c0207b98bfeb.html` — **får aldrig raderas**. Sitemap inskickad: första försöket "Hämtning misslyckades" (Google hann fetcha mitt i deployen), omskickad → **Lyckades, 10 sidor upptäckta**. Indexering begärd för `/`.
- **Viktigt fynd i URL-granskningen:** startsidan var *inte* indexerad med orsaken "Dublett: Google har valt en annan kanonisk sida än användaren" — Google hade valt **https://www.avyracards.se/** som kanonisk. Exakt det www-redirecten och canonical-taggen nu rättar; Google crawlade om 25 sep 00:03 (efter deployen) så det bör vända inom dagar. Hänvisande sida enligt Google: App Store-listningen (apps.apple.com/za/…).
- Efterfix (ej committad när detta skrevs): startsidans titel saknade " | AvyraCards" — Next tillämpar layoutens `title.template` bara på *underliggande* segment, och `app/page.tsx` ligger i samma segment som layouten. `pageMetadata` sätter nu `title.absolute` för `/`.

### Att göra direkt efter deploy (Oskar)
1. **Verifiera med curl, inte webbläsaren:** `curl -s https://avyracards.se/robots.txt`, `curl -s https://avyracards.se/sitemap.xml | grep -c '<loc>'` (ska ge 10), `curl -s https://avyracards.se/ | grep -o '<title>[^<]*'`, `curl -sI https://www.avyracards.se/ | head -3` (ska ge 308).
2. ~~Search Console~~ — KLART 2026-09-25, se status ovan. Nästa avläsning: Sidor-rapporten om ~1 vecka (antal indexerade av 10, om `/` bytt kanonisk från www till apex).
3. **App Store Connect:** lägg till **svensk lokalisering** på listningen (namn, undertitel "Digitalt visitkort med NFC", nyckelord, beskrivning). Idag är all svensk text under EN-locale. Hämta **provider token** (Analytics → Campaigns → Generate Campaign Link) och klistra in i `APP_STORE_PROVIDER_TOKEN` i `src/lib/seo.ts` — annars syns inte `ct=`-koderna som kampanjer.
4. **Analytics Reports API-nyckel** (Admin-roll, inte App Manager) för autonom installationsmätning — samma recept som i `nextwatch/marketing/ASC-API.md`. Claude får inte skapa nyckeln.
5. Ta bort `public/ads.txt` (dött AdSense-id).

## 2. Kanalmätning — vad vi vet

- Sajten har aldrig kunnat skicka en installation (0 App Store-länkar), så "Web Referrer" i ASC är strukturellt noll — inte ett bevis på att webben inte funkar.
- Installationssiffror per källa för AvyraCards är **inte avlästa** än (ASC-nyckel saknas). Första jobbet i den löpande körningen: läs Sources 21 aug → idag och logga baslinjen INNAN innehållet publiceras.
- Regel från playbooken: mätvärdet är **installationer, konton, kortordrar** — aldrig visningar.

## 3. SERP-research (48 sökningar, 2026-09-24)

Gjord av en research-subagent som läste faktiska sökresultat. Ordningen är en uppskattning (amerikanskt index), volymer är bedömningar — verifiera de viktigaste i inkognito på google.se innan skrivandet.

### Låst — satsa inte de första 12 månaderna
"digitalt visitkort", "digitala visitkort gratis", "digitalt visitkort företag", "skapa digitalt visitkort", "vad är ett digitalt visitkort", "visitkort med qr-kod" (tryckavsikt: Vistaprint/Adobe), "elektroniskt visitkort" (Outlook-hjälp), "länk i bio" (GoDaddy/Ecwid). Ägs av Digicard.se, Share My Card, Vistaprint, Microsoft eller globala QR-sajter.

### De 15 bästa fönstren (rangordnade enligt playbooken)

**Tillfälles-/situationsfrågor**
1. *vad gör man när visitkorten är slut* — rankar: axbom.se (2010), ifokus-forum, Avery → `/guide/visitkorten-ar-slut`
2. *nätverka utan visitkort* — Vistaprints visitkortshållare, EURES (2017), Wikipedia → `/guide/natverka-utan-visitkort`
3. *nfc-kort fungerar inte* (+android/iphone) — sweclockers-forum, betalningssupport; ingen felsökning för visitkort → `/hjalp/nfc-fungerar-inte` (vi har egen data från `/c/[cardCode]`)
4. *byta ut pappersvisitkort* / *visitkort som går att uppdatera* — ett Facebook-inlägg och en brittisk sajt → `/guide/byta-fran-pappersvisitkort`
5. *visitkort mässa tips* — montrar och tryck, ingen digital vinkel → `/guide/natverka-pa-massa`

**Kombinationsfrågor (bara vi kan svara på båda halvorna)**
6. *digitalt visitkort iphone* + *visitkort i apple wallet* — **nästan bara danska sidor**. Största enskilda fönstret; vi har appen och ett riktigt Wallet-pass → `/digitalt-visitkort-iphone`, `/apple-wallet-visitkort`
7. *nfc visitkort apple wallet* — bara engelska utvecklarforum → avsnitt på `/apple-wallet-visitkort`
8. *linktree alternativ svenska* — noll svenska jämförelser (EN/DE/NL) → `/linktree-alternativ` (Social-läget)
9. *digitalt visitkort linkedin* / *qr-kod linkedin visitkort* — LinkedIn Pulse ~2017 → `/guide/digitalt-visitkort-linkedin`
10. *digitalt visitkort i mejlsignatur* — KMH-intranät, Kronofogdens grafiska profil → `/guide/visitkort-i-mejlsignatur`

**Attribut-/filterfrågor**
11. *bästa digitala visitkortet* — etta är en maskinöversatt lista "2025" (HiHello → "Hej", Wave → "Våg Anslut") → `/basta-digitala-visitkort` (ärlig svensk jämförelse med kr-priser)
12. *nfc eller qr-kod visitkort* — MT-sidor från QR-säljare → `/guide/nfc-eller-qr-kod`
13. *metallvisitkort nfc pris* — UK-bolag, Amazon, kinesisk fabrik → `/nfc-visitkort/metall`
14. *visitkort app* / *digitalt visitkort utan app* — SERP visar skannerappar → `/app`

**Långsvans**
15. Yrkes-/målgruppssidor: hantverkare, mäklare, UF-företag, studenter/arbetsmarknadsdag, GDPR → `/for/[malgrupp]`; plus ett gratisverktyg **vCard-QR-generator** → `/verktyg/vcard-qr-kod` (inga svenska verktyg i den SERP:en)

**Medel (6–12 mån):** *nfc visitkort*, *visitkort med nfc* — svag SERP (nfckort.se från 2023 med stavfel i H1, e-visitkort.se 410 ord, ett UK-bolag) men kommersiell; kräver stark produktsida med Product-schema → `/nfc-visitkort`.

### Konkurrenter i svensk sök
Digicard.se (starkast: 1 600 ord, 2 tabeller, FAQPage+HowTo+Product-schema, pris synligt 499 kr/år), Cardcam.io (**~100 AI-artiklar sedan april 2026, ~1/dag** — täcker redan mässa, LinkedIn, mejlsignatur, Apple Wallet; generiskt, bara QR, inga tabeller/FAQPage, rankar ännu inte högt), Share My Card (730 ord, uppdaterad juli 2026, ingen FAQPage), QR Tiger/QR Code Chimp/eylet (maskinöversatta), nfcw.se (nederländskt), Spreadly (danska sidor). Tapni, Popl, Blinq, Mobilo, Linktree syns **inte** på svenska frågor.

**Systematiska svagheter att vinna på:** färskhet (2010–2017-sidor, "2025" i titlar), ingen egen data (ingen mäter NFC-läsavstånd per telefon, QR- vs NFC-konvertering, OS-stöd), bara Digicard har tabeller och schema, maskinöversatt svenska, ingen kopplar ihop link-in-bio och visitkort, ingen har NFC-felsökning eller svenska metallkortspriser.

**Hotet:** Cardcams volym stänger situationsfönstren inom månader. Skriv de 5 situationssidorna först.

Källor: se subagentens fullständiga lista längst ned.

## 4. Innehållsplan — våg 1 (10–12 sidor, handskrivet, delad renderare)

Struktur (samma som nextwatch, som fungerade):
```
src/lib/guides/content.ts      all copy per sida (intro, avsnitt, FAQ, tabelldata)
src/components/guide/GuideArticle.tsx   renderare: tabell + JSON-LD (Article/FAQPage/BreadcrumbList) + synligt dateModified + App Store-CTA + länk till /order
src/app/guide/[slug]/page.tsx  generateStaticParams + generateMetadata
```
Lägg varje sida i `PUBLIC_ROUTES` (sitemap) och länka den från footern eller navsidan `/guide`.

| # | URL | Fönster | Differentiering |
|---|---|---|---|
| 1 | `/guide/visitkorten-ar-slut` | situation | steg-för-steg, QR på telefonen på 60 s, tabell papper vs digitalt |
| 2 | `/guide/natverka-utan-visitkort` | situation | 5 sätt rankade, NameDrop/AirDrop vs QR vs NFC |
| 3 | `/hjalp/nfc-fungerar-inte` | situation | **egen data**: var NFC-antennen sitter per iPhone/Android-modell, vanliga fel från våra kort |
| 4 | `/guide/byta-fran-pappersvisitkort` | situation | kostnadstabell 3 år (Digicard gör detta — gör den bättre och färskare) |
| 5 | `/guide/natverka-pa-massa` | situation | checklista, namnbricka-QR, uppföljning |
| 6 | `/digitalt-visitkort-iphone` | kombination | appen + Wallet + Smart Banner; skärmdumpar från riktig iPhone |
| 7 | `/apple-wallet-visitkort` | kombination | hur passet funkar, NFC i Wallet, begränsningar |
| 8 | `/linktree-alternativ` | kombination | ärlig jämförelse med kr-priser, tabell |
| 9 | `/guide/digitalt-visitkort-linkedin` | kombination | QR till LinkedIn + AvyraCards-profil i "Featured" |
| 10 | `/guide/visitkort-i-mejlsignatur` | kombination | HTML-snutt att klistra in, Outlook/Gmail/Apple Mail |
| 11 | `/basta-digitala-visitkort` | attribut | 7 tjänster, pris/NFC/Wallet/svenska i tabell, dateModified |
| 12 | `/guide/nfc-eller-qr-kod` | attribut | tabell för/emot, när man behöver båda |

Våg 2: `/nfc-visitkort` (produktsida med Product-schema + priser), `/nfc-visitkort/metall`, `/for/{hantverkare,maklare,uf-foretag,studenter}`, `/verktyg/vcard-qr-kod`, `/guide/digitalt-visitkort-gdpr`.

Regler: 600–900 ord per sida, mät det. Egen intro/avsnitt/FAQ per sida — ingen generator som byter ett ord. Släpp i vågor om 10–12 från en tom domän. Datum som faktiskt uppdateras. Rubriken får inte lova något annat än innehållet levererar.

## 5. Förväntan (säg det innan någon blir besviken)

| När | Vad |
|---|---|
| vecka 1–2 | teknisk grund live, Search Console verifierad, sitemap inskickad |
| månad 1–3 | indexering. **Nära noll trafik.** Rapportera antal indexerade sidor |
| månad 3–6 | första long-tail-rankingarna (Wallet/iPhone, situationsfrågorna) |
| månad 6–12 | meningsfull trafik på svansen, `/nfc-visitkort` börjar röra sig |
| 12+ | medelsvåra termer om länkar tillkommit (UF, press, App Store) |

Organiskt är räntan, inte lönen. Det snabba är **Apple Search Ads på "digitalt visitkort"/"nfc visitkort"** — App Store-sök är den kanal som bevisat konverterar (4,6 % för Nextwatch; AvyraCards omätt).

## 6. Gränser
Inga automatiska likes/kommentarer/följningar på sociala plattformar. Det som erbjuds: sajten (växer av sig själv), Search Console-rapportering, Apple Search Ads, pressmejl, färdiga texter att posta manuellt.

## Subagentens källor (SERP-research 2026-09-24)
Konkurrentsidor: digicard.se/visitkort · sharemycard.se/funktion · qrcode-tiger.com/sv/best-digital-business-cards · cardcam.io/digitalt-visitkort-iphone-sa-anvander-du-det-i-apple-wallet/ · cardcam.io/post-sitemap.xml · eylet.com/sv/blog/what-is-an-nfc-business-card-… · digitaltvisitkort.se · e-visitkort.se · nfckort.se · axbom.se/dags-att-ateruppfinna-visitkortet/
SERP-domäner: qrcodechimp.com · qrcode-tiger.com/da/digital-business-card-apple-wallet · spreadly.app · ge-sign.com/blog/apple-wallet-business-card/ · artlogo.co · nfcw.se · jmband.co.uk · onlineprinters.se · fds-cards.co.uk/sv/premium-metall-nfc-visitkort · vistaprint.se/visitkort/qr-kod · support.microsoft.com/sv-se/office/…elektroniska-visitkort… · mobilocard.com/post/linktree-alternatives · se.godaddy.com/link-in-bio · linkx.ee/blog/var-finns-lanken-i-bio · se.linkedin.com/pulse/digitalt-visitkort-helt-gratis-kennet-båth · facebook.com/Cardster.se (inlägg) · sweclockers.com/forum/trad/1739765 · smyckestillverkning.ifokus.se/discussion/997888 · eures.europa.eu (2017) · kmh.se (visitkort-mejlsignatur) · pageloot.com/vcard-qr-code-generator/ · apps.apple.com/se/app/hihello-digitalt-visitkort/id1378114205 · developer.apple.com/forums/thread/724713 · passcreator.com (NFC passes) · tapni.com/blogs/alternatives/popl-alternatives · zazzle.se/mäklare+visitkort · teksajten.se (NameDrop) · vistaprint.se/hub/trade-show-marketing · it-kanalen.se (Kytes)
