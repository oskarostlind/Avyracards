import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-24 md:px-8">
        {/* HERO */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Live – AvyraCards
              </span>
              <span className="h-3 w-px bg-slate-700" />
              <span>Digitalt visitkort med NFC & länkprofil</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Ett kort. Alla dina länkar.
                <span className="block text-emerald-400">
                  Socialt & business, på samma plats.
                </span>
              </h1>
              <p className="max-w-xl text-sm text-slate-300 sm:text-base">
                AvyraCards samlar dina viktigaste länkar på en snygg profilsida
                – kopplad till ett NFC-kort du kan hålla mot en mobil.
                Perfekt för både sociala medier och professionella kontakter.
              </p>
            </div>

            {/* CTA + segment-indikator */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/get-started"
                className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
              >
                Skapa konto gratis
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm text-slate-300 underline-offset-4 hover:underline"
              >
                Se hur det funkar
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2.5 py-1">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Socialt
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-2.5 py-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Business
              </div>
              <span>• Fungerar både för privatpersoner & företag</span>
            </div>
          </div>

          {/* DEMO / VIDEO */}
          <div
            id="demo"
            className="relative h-[260px] overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-xl sm:h-[320px]"
          >
            {/* BYT UT TILL EGEN VIDEO / GIF I /public/media */}
            <video
              className="h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="/media/socialcard-demo.mp4" type="video/mp4" />
            </video>

            {/* Fallback / overlay-text om video ej laddas */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
            <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200">
              {/* Tom overlay just nu – kan fyllas med “Demo”/“Byt video i /public/media” om du vill */}
            </div>
          </div>
        </section>

        {/* HUR FUNKAR DET */}
        <section
          id="how-it-works"
          className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 md:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold sm:text-2xl">
                Så funkar AvyraCards
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                På några minuter har du en personlig landningssida och ett kort
                som tar folk dit direkt.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300">
              <span>För sociala medier & företag</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 rounded-2xl bg-slate-950/70 p-4">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                1
              </span>
              <h3 className="text-sm font-semibold">Skapa din profil</h3>
              <p className="text-xs text-slate-300">
                Registrera dig, lägg till profilbild, bio och alla länkar du
                vill dela – sociala medier, portfolio, bokning, kontakt m.m.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl bg-slate-950/70 p-4">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                2
              </span>
              <h3 className="text-sm font-semibold">Koppla NFC-kort</h3>
              <p className="text-xs text-slate-300">
                Beställ ett AvyraCards eller använd ett befintligt NFC-kort och
                peka det mot din unika profil-URL.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl bg-slate-950/70 p-4">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                3
              </span>
              <h3 className="text-sm font-semibold">Dela med ett tryck</h3>
              <p className="text-xs text-slate-300">
                Håll kortet mot en mobil eller dela länken. Mottagaren får alla
                dina uppgifter och kan spara dig direkt i sina kontakter.
              </p>
            </div>
          </div>
        </section>

        {/* FÖR SOCIALT / FÖR BUSINESS */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1 text-xs text-sky-300">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              Socialt
            </div>
            <h2 className="text-lg font-semibold">För kreatörer & sociala medier</h2>
            <p className="text-sm text-slate-300">
              Samla TikTok, Instagram, YouTube, Twitch, merch och
              övriga länkar på ett ställe. Perfekt när du träffar folk IRL och
              vill att de ska hitta rätt direkt.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-300">
              <li>• En URL i alla bios</li>
              <li>• Byt ordning på länkar när du vill</li>
              <li>• Olika teman för att matcha din stil</li>
            </ul>
            <Link
              href="/social"
              className="mt-4 inline-flex text-xs font-medium text-sky-300 underline-offset-4 hover:underline"
            >
              Läs mer om AvyraCards Social →
            </Link>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1 text-xs text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Business
            </div>
            <h2 className="text-lg font-semibold">För företag & yrkespersoner</h2>
            <p className="text-sm text-slate-300">
              Ersätt tryckta visitkort med en digital lösning. Håll kortet mot
              kundens mobil och låt dem spara dina uppgifter, bokningslänk,
              LinkedIn och mer – direkt.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-300">
              <li>• Modernt första intryck vid möten & event</li>
              <li>• Uppdatera info utan att trycka nya kort</li>
              <li>• Enhetligt utseende för hela teamet</li>
            </ul>
            <Link
              href="/business"
              className="mt-4 inline-flex text-xs font-medium text-amber-300 underline-offset-4 hover:underline"
            >
              Läs mer om AvyraCards Business →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">Vanliga frågor</h2>
            <p className="mt-1 text-sm text-slate-300">
              Här är svar på några av de vanligaste frågorna kring AvyraCards.
            </p>
          </div>

          <div className="space-y-3">
            <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-100">
                Behöver jag köpa ett NFC-kort för att använda AvyraCards?
                <span className="text-xs text-slate-400 group-open:hidden">
                  +
                </span>
                <span className="hidden text-xs text-slate-400 group-open:inline">
                  –
                </span>
              </summary>
              <p className="mt-2 text-xs text-slate-300">
                Nej, du kan använda din publika profil-URL utan kort. Men ett
                NFC-kort gör det extremt smidigt att dela dina uppgifter vid
                möten, event och spontana träffar.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-100">
                Fungerar AvyraCards på alla mobiler?
                <span className="text-xs text-slate-400 group-open:hidden">
                  +
                </span>
                <span className="hidden text-xs text-slate-400 group-open:inline">
                  –
                </span>
              </summary>
              <p className="mt-2 text-xs text-slate-300">
                De flesta moderna smartphones stödjer NFC. För äldre enheter
                eller där NFC är avstängt kan du alltid visa en QR-kod eller
                dela länken direkt.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-100">
                Är tjänsten anpassad för GDPR?
                <span className="text-xs text-slate-400 group-open:hidden">
                  +
                </span>
                <span className="hidden text-xs text-slate-400 group-open:inline">
                  –
                </span>
              </summary>
              <p className="mt-2 text-xs text-slate-300">
                Ja. Du styr själv vilken information du visar på din offentliga
                profil. Vi lagrar bara den data som behövs för att kunna
                tillhandahålla tjänsten.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-100">
                Kan jag använda samma profil både privat och i jobbet?
                <span className="text-xs text-slate-400 group-open:hidden">
                  +
                </span>
                <span className="hidden text-xs text-slate-400 group-open:inline">
                  –
                </span>
              </summary>
              <p className="mt-2 text-xs text-slate-300">
                Ja, du kan anpassa din länkprofil efter dina behov. Du kan när
                som helst växla mellan lägena “Socialt” och “Business” i din
                dashboard, och din publika profil på <code>/u/&lt;ditt-namn&gt;</code>{" "}
                uppdateras automatiskt.
              </p>
            </details>
          </div>
        </section>

        {/* SIMPLE BOTTOM CTA */}
        <section className="mt-4 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
          <h2 className="text-lg font-semibold">
            Redo att byta ut visitkort & link trees?
          </h2>
          <p className="mt-2 text-sm text-slate-200">
            Skapa ditt AvyraCards på ett par minuter och testa hur det känns att
            dela allt med ett enda tryck.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              Kom igång gratis
            </Link>
            <Link
              href="/login"
              className="text-sm text-emerald-200 underline-offset-4 hover:underline"
            >
              Jag har redan ett konto
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
