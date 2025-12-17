import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 selection:bg-emerald-500/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 pb-24 pt-24 md:px-8">
        
        {/* HERO SECTION */}
        <section className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>Lansering: AvyraCards</span>
              <span className="mx-1 h-3 w-px bg-slate-700" />
              <span className="text-slate-400">Nästa generations visitkort</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl leading-[1.1]">
                En sida. <br />
                Alla dina länkar.
                <span className="mt-2 block bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                  Socialt & Business.
                </span>
              </h1>
              <p className="max-w-xl text-lg text-slate-400 leading-relaxed">
                AvyraCards samlar din digitala närvaro på en snygg profilsida
                kopplad till ett smart NFC-kort. Dela vem du är med ett enda tryck mot en mobil.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/get-started"
                className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-500 px-8 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:scale-105 active:scale-95"
              >
                Skapa konto gratis
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-medium text-slate-300 transition-colors hover:text-white hover:bg-slate-900"
              >
                Se hur det funkar ↓
              </Link>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                För Privatpersoner
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                För Företag
              </div>
            </div>
          </div>

          {/* HERO VISUAL: 3D-liknande CSS-kort */}
          <div className="relative mx-auto w-full max-w-[400px] lg:max-w-none perspective-1000">
             {/* Bakgrundsglöd */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 to-sky-500/20 blur-3xl opacity-50" />
            
            <div className="relative h-[500px] w-full">
              {/* Telefonen */}
              <div className="absolute bottom-0 left-1/2 w-[280px] -translate-x-1/2 rounded-[3rem] border-8 border-slate-900 bg-slate-950 shadow-2xl overflow-hidden z-10">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 h-6 w-32 -translate-x-1/2 rounded-b-xl bg-slate-900 z-20"></div>
                
                {/* Skärminnehåll */}
                <div className="h-[550px] w-full bg-slate-900 pt-12 px-5 flex flex-col gap-4 overflow-hidden">
                  {/* Profil-header */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 shadow-inner flex items-center justify-center text-2xl">😎</div>
                    <div className="text-center space-y-1">
                      <div className="h-4 w-32 bg-slate-700 rounded-full mx-auto"/>
                      <div className="h-3 w-48 bg-slate-800 rounded-full mx-auto"/>
                    </div>
                  </div>
                  {/* Länkar */}
                  <div className="space-y-3 mt-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 w-full rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center px-4 gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-700/50" />
                        <div className="h-3 w-24 bg-slate-700/50 rounded-full" />
                      </div>
                    ))}
                  </div>
                   {/* Pop-up notis */}
                   <div className="mt-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 backdrop-blur-md">
                     <div className="flex gap-3">
                       <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">NFC</div>
                       <div>
                         <div className="text-xs text-emerald-400 font-bold mb-1">NFC-TAGG LÄST</div>
                         <div className="text-xs text-slate-300">Öppnar avyracards.se...</div>
                       </div>
                     </div>
                   </div>
                </div>
              </div>

              {/* Det svävande kortet */}
              <div className="absolute top-20 right-0 lg:-right-12 w-48 h-72 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl transform rotate-12 hover:rotate-6 transition-transform duration-500 z-20 flex flex-col items-center justify-center p-6 text-center group cursor-default">
                 {/* Kort-glans */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-2xl pointer-events-none" />
                 
                 <div className="h-12 w-12 rounded-full bg-emerald-500 mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-xl font-bold text-slate-950">
                   A
                 </div>
                 <h3 className="text-white font-bold tracking-widest text-sm uppercase">Avyra</h3>
                 <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Membership</p>
                 
                 <div className="absolute bottom-6 w-full px-6 flex justify-between items-end opacity-50">
                   <div className="h-6 w-8 rounded bg-yellow-500/20 border border-yellow-500/50"></div>
                   <div className="text-[10px] font-mono text-slate-500">((( • )))</div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS / TRUST */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 border-y border-slate-800 py-8 bg-slate-900/20">
            {[
              { label: "Användare", value: "2000+" },
              { label: "Visningar", value: "50k+" },
              { label: "Klimatsmart", value: "100%" },
              { label: "Designval", value: "Oändliga" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">{stat.label}</div>
              </div>
            ))}
        </section>

        {/* HUR FUNKAR DET */}
        <section id="how-it-works" className="py-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">Så funkar AvyraCards</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Vi har skalat bort krånglet. Ingen app krävs för personen du möter.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Skapa din profil",
                desc: "Registrera dig gratis. Lägg till din bild, bio, sociala medier, länkar och kontaktuppgifter på några minuter.",
                icon: "🎨"
              },
              {
                step: "02",
                title: "Koppla kortet",
                desc: "Beställ ett snyggt NFC-kort från oss. När det kommer, scanna det en gång för att koppla det till din profil.",
                icon: "🔗"
              },
              {
                step: "03",
                title: "Blippa & Dela",
                desc: "Håll kortet mot någons mobil. Din profil öppnas direkt i deras webbläsare. Magiskt enkelt.",
                icon: "✨"
              }
            ].map((item, i) => (
              <div key={i} className="relative group p-8 rounded-3xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
                <div className="absolute -top-6 left-8 h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-xl">
                  {item.icon}
                </div>
                <div className="mt-6">
                  <span className="text-xs font-bold text-emerald-500 tracking-wider mb-2 block">STEG {item.step}</span>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SPLIT SECTION: SOCIAL VS BUSINESS */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* SOCIAL CARD */}
          <div className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sky-900/20 to-slate-900 border border-sky-900/30 p-8 md:p-12 hover:border-sky-500/30 transition-all">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300 mb-6">
                Avyra Social
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">För kreatörer</h3>
              <p className="text-slate-400 mb-8 max-w-sm">
                En länk för allt. Samla TikTok, Instagram, YouTube och merch.
                Byt tema och matcha din vibe.
              </p>
              <ul className="space-y-3 mb-8 text-sm text-slate-300">
                <li className="flex items-center gap-2"><span className="text-sky-400">✓</span> Obegränsat antal länkar</li>
                <li className="flex items-center gap-2"><span className="text-sky-400">✓</span> Anpassade teman</li>
                <li className="flex items-center gap-2"><span className="text-sky-400">✓</span> QR-kod ingår</li>
              </ul>
              <Link href="/social" className="inline-flex items-center text-sky-400 font-medium hover:text-sky-300 transition-colors">
                Utforska Social <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            {/* Dekorativ bakgrund */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>

          {/* BUSINESS CARD */}
          <div className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-900/30 p-8 md:p-12 hover:border-emerald-500/30 transition-all">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 mb-6">
                Avyra Business
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">För proffs</h3>
              <p className="text-slate-400 mb-8 max-w-sm">
                Ersätt papperskortet. Dela kontaktuppgifter, LinkedIn och bokning direkt till kundens telefonbok.
              </p>
              <ul className="space-y-3 mb-8 text-sm text-slate-300">
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Spara-kontakt-knapp (vCard)</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Team-hantering</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Analys & Statistik</li>
              </ul>
              <Link href="/business" className="inline-flex items-center text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
                Utforska Business <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            {/* Dekorativ bakgrund */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-12 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-emerald-500/20 blur-[100px] rounded-full" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Redo att uppgradera ditt nätverkande?</h2>
            <p className="text-slate-400 text-lg">
              Skapa ditt konto idag och upptäck hur enkelt det är att dela med AvyraCards.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/get-started"
                className="rounded-full bg-emerald-500 px-8 py-3 text-base font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Kom igång nu
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-slate-800 px-8 py-3 text-base font-medium text-white hover:bg-slate-700 transition-colors"
              >
                Logga in
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}