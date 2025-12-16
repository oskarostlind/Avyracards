import Link from "next/link";

export default function SocialLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-16 md:px-8 md:pt-20">
        {/* HERO */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-950/40 px-3 py-1 text-xs text-sky-100">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                AvyraCards Social
              </span>
              <span className="h-3 w-px bg-sky-700/70" />
              <span>Digital lAnkprofil fAr kreatArer</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Samla alla dina lAnkar
                <span className="block text-sky-300">
                  i en snygg profil.
                </span>
              </h1>
              <p className="max-w-xl text-sm text-slate-300 sm:text-base">
                AvyraCards Social Ar byggt fAr kreatArer, streamers och alla som
                vill dela allt viktigt pA ett stAlle. Koppla lAnkar, merch, bokning och
                mycket mer.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/get-started"
                className="rounded-full bg-sky-400 px-6 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-300"
              >
                Skapa konto gratis
              </Link>
              <Link
                href="#features"
                className="text-sm text-slate-300 underline-offset-4 hover:underline"
              >
                Se funktioner
              </Link>
            </div>

            <p className="text-xs text-slate-400">
              Perfekt fAr bios pA TikTok, Instagram, YouTube, Twitch och mer.
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
                  <div className="h-8 flex-1 rounded-full bg-sky-500/80" />
                  <div className="h-8 flex-1 rounded-full bg-slate-800" />
                </div>
                <div className="h-8 rounded-full bg-slate-800" />
              </div>
              <div className="absolute bottom-3 right-4 text-[10px] text-slate-500">
                Exempelvy ƒ?" inte riktig data
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">Funktioner fAr kreatArer</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              Byggt fAr kreatArer och profiler som vill fA en modern lAsning fAr sina lAnkar.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold">Alla lAnkar pA en plats</h3>
              <p className="text-xs text-slate-300">
                Samla sociala medier, merch, bokningar och kontakt i en lAnkar-sida som Ar enkel att uppdatera.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold">Matcha din stil</h3>
              <p className="text-xs text-slate-300">
                VAlj teman och anpassa utseendet fAr att passa ditt varumArke och din estetik.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold">Delas med ett tryck</h3>
              <p className="text-xs text-slate-300">
                Koppla till ett NFC-kort frAn AvyraCards och dela med ett tryck pA mobilen, eller via QR-kod och lAnk.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-4 rounded-3xl border border-sky-500/40 bg-sky-500/10 p-6 text-center">
          <h2 className="text-lg font-semibold">Redo att samla allt?</h2>
          <p className="mt-2 text-sm text-slate-200">
            Skapa din AvyraCards-profil pA ett par minuter och dela med en enda lAnk.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-white px-6 py-2 text-sm font-medium text-slate-950 hover:bg-slate-200"
            >
              Skapa konto
            </Link>
            <Link
              href="/login"
              className="text-sm text-sky-200 underline-offset-4 hover:underline"
            >
              Jag har redan ett konto
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
