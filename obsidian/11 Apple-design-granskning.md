---
skapad: 2026-09-24
uppdaterad: 2026-09-25
---

# Apple-design-granskning — AvyraCards webb/app

Granskning av gränssnittet mot Apples designprinciper (*Designing Fluid Interfaces*, *Principles of Great Design*, *Details of UI Typography*) översatta till webben. Fokus: respons, avbrytbarhet, spatial konsekvens, material, typografi, reducerad rörelse. Se [[10 SEO & organisk tillväxt]] för det som gjordes samma dag.

## Sammanfattning
Grunden är bra: systemtypsnittslik sans (Manrope via next/font), stram hero-typografi (`tracking-tight`, `leading-[1.05]`), translucent navbar med `backdrop-blur`, tryckåterkoppling på primärknapparna. Tre saker drar ner: **alla entré-animationer är döda kod**, ingen respekt för systeminställningar (fixat idag), och tryckytorna i dashboarden är för små för tumme.

## Fixat 2026-09-24 (i working tree)
| Vad | Var | Princip |
|---|---|---|
| `prefers-reduced-motion: reduce` neutraliserar animationer/transitioner (opacitet/färg får ändras, inget glider/studsar/pulserar) | `globals.css` | §14 Reduced motion |
| `prefers-reduced-transparency: reduce` gör `backdrop-blur`-ytorna solida | `globals.css` | §12/§14 Material |
| Publika profilens länkknappar fick `active:scale-[0.97]` + `duration-150` och animerar bara transform/färg/skugga (inte `transition-all`) | `social-profile.tsx`, `business-profile.tsx` | §1 Respons på pointer-down, §11 kompositörsvänliga egenskaper |
| Smart App Banner på marknadssidorna (inte på profiler) | `seo-metadata.ts` | §16 Familiarity — plattformens egna mönster |

## Ny startsida byggd 2026-09-25 (riktning C "Kortet i fokus")
Oskar valde prototyp C av fyra (design-canvas "AvyraCards startsida – prototyper"). Implementerad i `src/components/landing/home-view.tsx`, verifierad renderad i molnmiljön (desktop 1440 + mobil 390, sv, inga konsolfel).
- Hero: rubrik + **det riktiga plastkortet** via `CardPreview3D` (ny prop `showControls={false}`) — matt svart, ISO ID-1, enbart lockupen, samma tilt som i shopen. Prototypens kort (namn, NFC-ikon, chip) var FEL mot verkligheten och byttes ut.
- Telefon-demo med Social/Business-växling (`PhoneDemo`, state i vyn, `aria-pressed`, `aria-live`), copy via nya `home.demo*`-nycklar i sv+en.
- Problem-sektionen som redaktionell lista, kärnkonceptet som två kort, "Så funkar det" som tidslinje, FAQ som accordion med första öppen, slut-CTA i turkos.
- Designregler: en accent (nordic-accent), `active:scale` på alla knappar, inga eviga animationer (animate-bounce/pulse borta), tryckytor ≥ 44 px, `transition-[…]` i stället för `transition-all`.
- Bonus: `.perspective-1000` fanns aldrig i CSS:en — tillagd i globals.css, så kortets 3D-tilt får djup även i shopen.

## Hittat — prioriterat

### 1. 55 `animate-in`/`fade-in`/`slide-in-*`/`zoom-in` gör ingenting (hög)
`tailwind.config.js` har `plugins: []` och `tailwindcss-animate` finns inte i package.json. Klasserna är designade (hero, modaler, cookie-banner, onboarding) men renderas aldrig — allt poppar in hårt. **Beslut att ta:** installera `tailwindcss-animate` (`npm i -D tailwindcss-animate`, `plugins: [require("tailwindcss-animate")]`) och **granska varje ställe** — 55 animationer som tänds samtidigt är inte automatiskt bra. Behåll korta entréer (150–250 ms, opacitet + ≤8 px förflyttning), ta bort `duration-1000 delay-200 zoom-in` på hero-telefonen (för långsam för första intrycket). Reduced-motion-regeln i globals.css täcker dem när de tänds.

### 2. Modaler och sheets utan utgång, utan semantik (hög)
`profile-preview-modal.tsx`, `analytics-event-modal.tsx`, mobilmenyn i `navbar-client.tsx` och `CollapsibleSection` renderas villkorligt (`{open && …}`): de kan aldrig animera ut, alltså bryts §7 (samma väg in som ut). Bara en komponent har `role="dialog"`/`aria-modal`; ingen stänger på Escape eller låser fokus. Rekommendation: en liten `Sheet`/`Dialog`-primitiv (Radix Dialog eller egen med `<dialog>`), som animerar in **och** ut från triggerns håll (`transform-origin` mot knappen), stänger på Escape/klick utanför, och i mobil dras ned med fingret (1:1, velocity-handoff — Vaul gör detta rätt).

### 3. Tryckytor under 44 pt (medel)
`px-3 py-1 text-xs` (≈24 px höga) på dölj/ta bort i `link-card.tsx`, `h-7 w-7` på accordion-knappen, `h-6 w-6`/`h-8 w-8` ikonknappar i dashboarden. Appen används med tumme. Minsta höjd 44 px (`min-h-11`) och hit-padding runt små ikoner; visuell storlek kan vara mindre än träffytan.

### 4. `transition-all` ×100 (medel)
Animerar allt inklusive layoutegenskaper → jank på svagare telefoner. Byt till `transition-[transform,opacity,background-color,box-shadow]` (eller Tailwinds `transition-colors`/`transition-transform`) där det inte redan är gjort.

### 5. Evig rörelse i hero (medel)
`animate-bounce duration-[2000ms]` på NFC-popupen och `animate-pulse` på platshållarna loopar för alltid vid ~0,5 Hz — precis det §14 varnar för (långsamma loopar). Låt studsen köra 2–3 gånger (`animation-iteration-count: 3`) eller trigga den på scroll-in.

### 6. Inputs med `text-sm`/`text-xs` (medel)
24 av 68 `<input>` har text under 16 px. I Safari zoomar iOS in på fokus; i WKWebView förhindras det av `maximumScale: 1`, vilket samtidigt blockerar pinch-zoom för alla (WCAG 1.4.4). Sätt `text-base` på inputs och överväg att bara låsa `maximumScale` i appen (`isApp`), inte på webben.

### 7. Typografi (låg)
- Brödtext i `font-light` på svart bakgrund (`heroBody`, FAQ-svar) tappar läsbarhet på icke-retina; Apples regel över mörka/translucenta ytor är *tyngre* vikt, inte lättare. Använd `font-normal`.
- Fast `tracking-widest` på små versaler är rätt; kontrollera att `tracking-[0.2em]` på "AVYRA"-kortet inte spricker vid 11 px.
- Layoutavstånd är i `rem` via Tailwind — Dynamic Type/Textstorlek följer med. Bra.

### 8. Konsekvens (låg)
Startsidans FAQ animerar öppning (grid-rows-trick, bra), dashboardens `CollapsibleSection` gör det inte. Samma metafor ska bete sig likadant (§16 Familiarity). Ge accordionen samma grid-rows-övergång.

### 9. Wayfinding i profilvyn (låg)
Publika profilen har "Powered by AvyraCards"-fot men ingen väg tillbaka till egna dashboarden när man är inloggad och tittar på sin egen profil. Liten "Redigera"-chip för ägaren svarar på *var kan jag gå?*.

## Vad som redan är rätt
- Primärknappar: `hover:scale-[1.02] active:scale-[0.98]` — återkoppling på tryck, inte bara release.
- Navbar: `bg-nordic-primary/80 backdrop-blur-md` med innehåll som scrollar under, safe-area-padding i appen.
- Hero-typografi: negativ tracking och tajt radavstånd på stor text, luftigare på brödtext.
- `viewportFit: cover` + `env(safe-area-inset-top)`.
- Färgsystem centraliserat (`nordic.*`), inga slumpmässiga hex-värden i vyerna.

## Ordning om man gör en design-sprint
1. Installera `tailwindcss-animate` och gå igenom de 55 ställena (halv dag).
2. Dialog/Sheet-primitiv med in- och ut-animation, Escape, fokuslås; byt ut de tre modalerna och mobilmenyn (1 dag).
3. Tryckytor + input-textstorlek i dashboarden (2 h).
4. `transition-all` → specifika egenskaper (1 h, sök/ersätt med ögonen på).
