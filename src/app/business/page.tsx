import Link from "next/link";

export default function BusinessLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-16 md:px-8 md:pt-20">
        {/* HERO */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/40 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-100">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                SocialCard Business
              </span>
              <span className="h-3 w-px bg-emerald-700/70" />
              <span>Digitalt visitkort för yrkespersoner & företag</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Ersätt visitkortet
                <span className="block text-emerald-400">
                  med en smartare profil.
                </span>
              </h1>
              <p className="max-w-xl text-sm text-slate-300 sm:text-base">
                Visa namn, titel, företag och kontaktuppgifter på en stilren
                sida som är lätt att spara. Kombinera med ett NFC-kort för att
                dela dina uppgifter med ett enda tryck mot mobilen.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/get-started"
                className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
              >
                Skapa professionell profil
              </Link>
              <Link
                href="#business-features"
                className="text-sm text-slate-300 underline-offset-4 hover:underline"
              >
                Se vad som ingår
              </Link>
            </div>

            <p className="text-xs text-slate-400">
              Perfekt för säljare, konsulter, frilansare och team som tröttnat
              på tryckta visitkort.
            </p>
          </div>

          {/* Mockup */}
          <div className="relative h-[260px] overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-xl sm:h-[320px]">
            <div className="absolute inset-6 rounded-3xl bg-slate-950/70 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-700" />
                <div className="space-y-1">
                  <div className="h-3 w-36 rounded bg-slate-700" />
                  <div className="h-2.5 w-28 rounded bg-slate-800" />
                  <div className="h-2 w-24 rounded bg-slate-800" />
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <div className="flex gap-2">
                  <div className="h-8 flex-1 rounded-full bg-emerald-600/80" />
                  <div className="h-8 flex-1 rounded-full bg-slate-800" />
                </div>
                <div className="h-8 rounded-full bg-slate-800" />
              </div>
              <div className="absolute bottom-3 right-4 text-[10px] text-slate-500">
                Exempelvy – inte riktig data
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="business-features" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">
              Ett modernt visitkort för alla dina möten
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              Byggt för personer som träffar kunder, partners och kontakter –
              oavsett om du är anställd, konsult eller driver eget.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold">Tydlig kontaktvy</h3>
              <p className="text-xs text-slate-300">
                Visa namn, titel, företag, telefon och e-post i ett enkelt,
                lättläst layout. Mottagaren slipper fota ditt visitkort.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold">Spara som kontakt</h3>
              <p className="text-xs text-slate-300">
                Med ett tryck kan mottagaren spara dina uppgifter som kontakt i
                sin mobil (vCard), utan att skriva in allt manuellt.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold">Fungerar för hela teamet</h3>
              <p className="text-xs text-slate-300">
                Beställ flera kort i samma order. Varje kort kan sedan aktiveras
                av respektive medarbetare via ett eget claim-flöde.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="mt-4 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
          <h2 className="text-lg font-semibold">
            Gör ett bättre första intryck vid nästa möte
          </h2>
          <p className="mt-2 text-sm text-slate-200">
            Skapa en professionell profil på några minuter. När du är redo kan du
            lägga till fysiska NFC-kort för dig själv eller hela teamet.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/register?mode=business"
              className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              Skapa professionell profil
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
