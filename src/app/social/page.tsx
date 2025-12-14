import Link from "next/link";

export default function SocialLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-16 md:px-8 md:pt-20">
        {/* HERO */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-600/40 bg-sky-950/40 px-3 py-1 text-xs text-sky-100">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                SocialCard Social
              </span>
              <span className="h-3 w-px bg-sky-700/70" />
              <span>Link-in-bio & NFC-kort för kreatörer</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Samla alla dina länkar
                <span className="block text-sky-400">
                  i en profil du faktiskt gillar.
                </span>
              </h1>
              <p className="max-w-xl text-sm text-slate-300 sm:text-base">
                En länk för alla dina kanaler – TikTok, Instagram, YouTube,
                Twitch, merch, bokningar och mer. Koppla den till ett
                NFC-kort för en riktig “wow”-känsla IRL.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/get-started?"
                className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/25 transition hover:bg-sky-400"
              >
                Skapa gratis social profil
              </Link>
              <Link
                href="#features"
                className="text-sm text-slate-300 underline-offset-4 hover:underline"
              >
                Se vad som ingår
              </Link>
            </div>

            <p className="text-xs text-slate-400">
              Gratis att börja med. Uppgradera till premium senare om du vill ha
              mer statistik, teman och kontroll.
            </p>
          </div>

          {/* Enkel mockup / placeholder */}
          <div className="relative h-[260px] overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-xl sm:h-[320px]">
            <div className="absolute inset-6 rounded-3xl bg-slate-950/70 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-400 to-fuchsia-500" />
                <div className="space-y-1">
                  <div className="h-3 w-32 rounded bg-slate-700" />
                  <div className="h-2.5 w-20 rounded bg-slate-800" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="h-8 rounded-full bg-slate-800" />
                <div className="h-8 rounded-full bg-slate-800" />
                <div className="h-8 rounded-full bg-slate-800" />
              </div>
              <div className="absolute bottom-3 right-4 text-[10px] text-slate-500">
                Exempelvy – inte riktig data
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">
              Bygg din sociala hub på några minuter
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              SocialCard Social är byggt för kreatörer, streamers och alla som
              vill samla sitt digitala liv på ett ställe.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold">Alla länkar på ett ställe</h3>
              <p className="text-xs text-slate-300">
                Lägg till obegränsat med länkar till dina viktigaste plattformar:
                TikTok, Instagram, YouTube, Twitch, Spotify, Patreon med mera.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold">Teman & stil</h3>
              <p className="text-xs text-slate-300">
                Anpassa färger, bakgrund och stil så att din profil matchar ditt
                varumärke. Premium ger ännu mer kontroll.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold">Redo för bio & NFC-kort</h3>
              <p className="text-xs text-slate-300">
                Lägg samma länk i alla dina bios – eller koppla den till ett
                fysiskt NFC-kort som du kan dela IRL.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="mt-4 rounded-3xl border border-sky-500/40 bg-sky-500/10 p-6 text-center">
          <h2 className="text-lg font-semibold">
            Redo att uppgradera din link-in-bio?
          </h2>
          <p className="mt-2 text-sm text-slate-200">
            Skapa en gratis profil, lägg till dina viktigaste länkar och testa
            hur det känns. Du kan alltid uppgradera senare.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/register?mode=social"
              className="rounded-full bg-sky-500 px-6 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
            >
              Skapa gratis social profil
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
