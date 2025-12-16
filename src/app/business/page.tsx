import Link from "next/link";

export default function BusinessLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 selection:bg-emerald-500/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-4 pb-24 pt-20 md:px-8">
        
        {/* HERO SECTION */}
        <section className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          
          {/* TEXT CONTENT */}
          <div className="space-y-8 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-4 py-1.5 text-xs font-semibold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Avyra Business
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Det sista visitkortet <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  du behöver köpa.
                </span>
              </h1>
              <p className="max-w-xl text-lg text-slate-400 leading-relaxed">
                Byt ut papperskorten mot en digital, hållbar lösning. Dela kontaktuppgifter,
                LinkedIn och bokningslänkar direkt till kundens telefonbok med ett tryck.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register?mode=business"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500"
              >
                Skapa företagsprofil
              </Link>
              <Link
                href="#roi"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-transparent px-8 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Beräkna besparing
              </Link>
            </div>
            
            <p className="text-xs text-slate-500 font-medium pt-4 border-t border-slate-800 w-max">
              Används av konsulter, säljare och mäklare över hela Sverige.
            </p>
          </div>

          {/* BUSINESS PHONE MOCKUP */}
          <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />

             <div className="relative w-[300px] h-[600px] bg-slate-900 rounded-[3rem] border-[10px] border-slate-800 shadow-2xl overflow-hidden ring-1 ring-slate-700/50">
               {/* Business Header */}
               <div className="h-40 bg-slate-800 w-full relative overflow-hidden">
                 {/* Abstrakt mönster */}
                 <div className="absolute inset-0 bg-emerald-900/20"></div>
                 <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>
               </div>
               
               <div className="px-6 relative -mt-16">
                 {/* Profilbild */}
                 <div className="h-28 w-28 rounded-full border-4 border-slate-900 bg-slate-800 shadow-xl overflow-hidden flex items-center justify-center text-4xl">
                   👔
                 </div>
                 
                 <div className="mt-4">
                   <h3 className="text-2xl font-bold text-white">Erik Svensson</h3>
                   <p className="text-emerald-400 font-medium">Sales Director</p>
                   <p className="text-slate-400 text-sm">TechSolutions AB</p>
                 </div>

                 {/* Action Buttons */}
                 <div className="grid grid-cols-2 gap-3 mt-6">
                   <button className="col-span-2 bg-emerald-600 h-12 rounded-xl text-white font-semibold shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2">
                     <span>Spara Kontakt</span>
                   </button>
                   <button className="bg-slate-800 h-10 rounded-xl text-slate-300 text-sm font-medium border border-slate-700">
                     Maila
                   </button>
                   <button className="bg-slate-800 h-10 rounded-xl text-slate-300 text-sm font-medium border border-slate-700">
                     Ring
                   </button>
                 </div>

                 {/* Contact List */}
                 <div className="mt-8 space-y-4">
                   <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                     <div className="h-8 w-8 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">in</div>
                     <div className="text-sm text-slate-300">Anslut på LinkedIn</div>
                   </div>
                   <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                     <div className="h-8 w-8 rounded bg-slate-700 flex items-center justify-center text-slate-400">🌐</div>
                     <div className="text-sm text-slate-300">Besök Hemsida</div>
                   </div>
                   <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                     <div className="h-8 w-8 rounded bg-slate-700 flex items-center justify-center text-slate-400">📅</div>
                     <div className="text-sm text-slate-300">Boka ett möte</div>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </section>

        {/* VALUE PROPS */}
        <section id="features" className="py-10">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl">🚀</div>
              <h3 className="text-xl font-bold text-white">Alltid uppdaterad</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Bytt jobb eller nummer? Uppdatera din profil på sekunder. Du behöver aldrig mer beställa nya papperskort för att en titel ändras.
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl">🌱</div>
              <h3 className="text-xl font-bold text-white">Hållbart val</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Minska papperssvinnet. Ett Avyra-kort i metall eller återvunnen plast håller i åratal och sparar tusentals papperskort.
              </p>
            </div>
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl">📊</div>
              <h3 className="text-xl font-bold text-white">Mätbara möten</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                För företag: Få statistik på hur ofta era kort används. Koppla ihop fysiska möten med digital uppföljning.
              </p>
            </div>
          </div>
        </section>

        {/* TEAM SECTION */}
        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-8 md:p-12 text-center md:text-left grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Hantera hela teamet</h2>
            <p className="text-slate-400">
              Beställ kort till alla anställda. Som admin kan du låsa mallar för varumärkeskonsistens men låta anställda uppdatera sina egna kontaktuppgifter.
            </p>
            <ul className="space-y-2 text-sm text-slate-300 inline-block text-left">
              <li className="flex gap-2">✓ Central administration</li>
              <li className="flex gap-2">✓ Bulk-import av anställda</li>
              <li className="flex gap-2">✓ Enhetlig varumärkesprofil</li>
            </ul>
          </div>
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 transform rotate-2 hover:rotate-0 transition-transform duration-500">
             {/* Admin UI Mockup */}
             <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
               <div className="font-semibold text-white">Team Dashboard</div>
               <div className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Admin</div>
             </div>
             <div className="space-y-3">
               {[1,2,3].map(i => (
                 <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-slate-800" />
                     <div className="text-xs text-slate-300">Anställd {i}</div>
                   </div>
                   <div className="h-2 w-2 rounded-full bg-emerald-500" />
                 </div>
               ))}
             </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="text-center py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Ta steget in i framtiden</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register?mode=business"
              className="rounded-full bg-emerald-600 px-8 py-3 text-base font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Kom igång nu
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-slate-700 px-8 py-3 text-base font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Kontakta sälj
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}