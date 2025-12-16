import Link from "next/link";
//import Image from "next/image";

export default function SocialLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 selection:bg-sky-500/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-4 pb-24 pt-20 md:px-8">
        
        {/* HERO */}
        <section className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/30 px-4 py-1.5 text-xs font-semibold text-sky-200">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              Avyra Social
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                En länk för <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                  hela din värld.
                </span>
              </h1>
              <p className="max-w-xl text-lg text-slate-400 leading-relaxed">
                AvyraCards Social är byggt för kreatörer, artister och influencers. 
                Samla TikTok, Instagram, YouTube och merch på en snygg landningssida.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="rounded-full bg-sky-500 px-8 py-3 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.3)] transition hover:bg-sky-400 hover:scale-105"
              >
                Skapa min sida
              </Link>
              <Link
                href="#features"
                className="rounded-full border border-slate-700 bg-slate-900/50 px-8 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                Funktioner
              </Link>
            </div>
          </div>

          {/* SOCIAL PHONE MOCKUP */}
          <div className="relative flex justify-center lg:justify-end">
             {/* Bakgrunds-blob */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-sky-500/20 rounded-full blur-[80px]" />

             {/* Telefonen */}
             <div className="relative w-[300px] h-[600px] bg-slate-950 rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden ring-1 ring-slate-800">
               {/* Notch */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-20" />
               
               {/* Screen Content */}
               <div className="h-full w-full bg-slate-900 overflow-y-auto hide-scrollbar">
                 {/* Cover & Header */}
                 <div className="h-32 bg-gradient-to-br from-indigo-600 to-sky-600 w-full relative"></div>
                 <div className="px-6 -mt-10 flex flex-col items-center">
                   <div className="h-20 w-20 rounded-full border-4 border-slate-900 bg-slate-800 overflow-hidden relative shadow-lg">
                      {/* Avatar placeholder - Använd Image om du har en fil */}
                      <div className="absolute inset-0 bg-slate-700 flex items-center justify-center text-2xl">🎨</div>
                   </div>
                   <h3 className="mt-3 text-lg font-bold text-white">Alex Creator</h3>
                   <p className="text-xs text-slate-400 text-center mt-1 px-4">
                     Digital artist & Content Creator. New video every Friday! 📸
                   </p>
                   
                   {/* Social Icons */}
                   <div className="flex gap-4 mt-4">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-400">
                         icon
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Link Buttons */}
                 <div className="px-5 mt-6 space-y-3">
                   {["Senaste YouTube Videon", "Köp min Merch", "Boka fotografering", "Min Portfolio"].map((label, i) => (
                     <div key={i} className="group relative w-full p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-sky-500/10 hover:border-sky-500/50 transition-all cursor-pointer flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200">{label}</span>
                        <div className="text-slate-500 group-hover:text-sky-400">→</div>
                     </div>
                   ))}
                   {/* Spotify Embed Mockup */}
                   <div className="w-full h-20 rounded-xl bg-green-500/10 border border-green-500/20 mt-4 flex items-center gap-3 px-3">
                      <div className="h-12 w-12 rounded bg-green-500/20"></div>
                      <div className="space-y-1">
                        <div className="h-2 w-24 bg-green-500/30 rounded"></div>
                        <div className="h-2 w-16 bg-green-500/20 rounded"></div>
                      </div>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Allt du behöver för att växa</h2>
            <p className="text-slate-400">Du skapar innehållet, vi gör det enkelt för din publik att hitta det.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Tema & Design", desc: "Välj färger, typsnitt och bakgrunder som matchar ditt personliga varumärke." },
              { title: "NFC-kompatibel", desc: "Koppla till våra NFC-kort och dela din profil IRL genom att bara blippa." },
              { title: "Statistik", desc: "Se vilka länkar dina följare klickar på mest och optimera ditt flöde." }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-sky-500/30 transition-colors">
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM BANNER */}
        <section className="relative rounded-[3rem] overflow-hidden bg-sky-600 px-6 py-20 text-center">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-sky-900/80 to-transparent"></div>
          
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-white">Sluta tappa följare</h2>
            <p className="text-sky-100">
              Gör det enkelt för folk att hitta allt du gör. En länk i bio är allt som behövs.
            </p>
            <Link 
              href="/register" 
              className="inline-block rounded-full bg-white px-8 py-3 text-sky-900 font-bold hover:bg-slate-100 transition-colors"
            >
              Kom igång gratis
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}