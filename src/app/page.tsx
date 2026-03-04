"use client";

import Link from "next/link";
import { Check, ArrowRight, Layers, Users, ShieldCheck, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-nordic-primary text-nordic-secondary selection:bg-emerald-500/30 overflow-hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-4 pb-24 pt-24 md:px-8">
        
        {/* --- 1. HERO SECTION (OVANFÖR FOLD) --- */}
        <section className="grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 backdrop-blur-sm shadow-lg shadow-emerald-500/5">
              <span>Nyhet</span>
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium">Google Wallet Integration</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl font-bold tracking-tight text-nordic-secondary sm:text-6xl lg:text-7xl leading-[1.05]">
                Dela rätt <br />
                <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                  version av dig.
                </span>
                <br />
                Varje gång.
              </h1>
              <p className="max-w-lg text-lg text-nordic-highlight leading-relaxed font-light">
                AVYRA är din digitala identitet. En profil som anpassar sig efter sammanhang – privat och professionellt.
                Gratis att börja. Uppgradera när du vill.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/get-started"
                  className="inline-flex h-14 items-center justify-center rounded-2xl bg-emerald-500 px-8 text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Skapa gratis profil
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex h-14 items-center justify-center rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 px-8 text-base font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-nordic-secondary"
                >
                  Se hur det funkar <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* Trust Microcopy */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-nordic-highlight">
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Tar under 2 minuter</span>
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Funkar direkt i mobilen</span>
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Inget kort krävs</span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL (Din 3D-Telefon - något uppdaterad) */}
          <div className="relative mx-auto w-full max-w-[400px] lg:max-w-none perspective-1000 animate-in fade-in zoom-in duration-1000 delay-200">
            {/* Bakgrundsglöd */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-emerald-500/20 to-sky-500/20 blur-[80px] opacity-60 pointer-events-none" />
            
            <div className="relative h-[600px] w-full flex items-center justify-center">
              {/* Telefonen */}
              <div className="absolute w-[300px] rounded-[3.5rem] border-[8px] border-nordic-highlight/30 bg-nordic-primary shadow-2xl overflow-hidden z-10 rotate-[-6deg] hover:rotate-0 transition-transform duration-700 ease-out">
                {/* Dynamic Island / Notch */}
                <div className="absolute top-4 left-1/2 h-7 w-28 -translate-x-1/2 rounded-full bg-nordic-primary z-20"></div>
                
                {/* Skärminnehåll */}
                <div className="h-[620px] w-full bg-nordic-primary pt-16 px-6 flex flex-col gap-6 overflow-hidden relative">
                  {/* Bakgrundsbild/Gradient på skärmen */}
                  <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-slate-800 to-slate-950 opacity-50" />

                  {/* Profil-header */}
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="h-24 w-24 rounded-full p-1 bg-gradient-to-tr from-emerald-400 to-sky-400">
                        <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center text-3xl border-4 border-slate-950">
                            👋
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="h-5 w-40 bg-slate-800 rounded-full mx-auto animate-pulse"/>
                      <div className="h-3 w-24 bg-slate-800/50 rounded-full mx-auto"/>
                    </div>
                  </div>
                  
                  {/* Länkar */}
                  <div className="relative z-10 space-y-3 mt-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-14 w-full rounded-2xl bg-slate-900 border border-nordic-highlight/40 flex items-center px-4 gap-4 shadow-sm">
                        <div className="h-9 w-9 rounded-full bg-slate-800" />
                        <div className="h-3 w-32 bg-slate-800 rounded-full" />
                      </div>
                    ))}
                  </div>

                  {/* NFC Pop-up (Simulerad) */}
                  <div className="absolute bottom-8 left-4 right-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-4 animate-bounce duration-[2000ms]">
                      <div className="flex gap-3 items-center">
                        <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shrink-0">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-emerald-300 font-bold mb-0.5 tracking-wide">NFC-TAGG HITTAD</div>
                          <div className="text-xs text-nordic-secondary truncate">Öppnar avyra.se/alex...</div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>

              {/* Det svävande visitkortet */}
              <div className="absolute bottom-20 -right-4 md:-right-12 w-56 h-80 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-nordic-highlight/40 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] transform rotate-[12deg] hover:rotate-[15deg] transition-transform duration-500 z-20 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-2xl pointer-events-none" />
                
                <div className="h-16 w-16 rounded-full bg-emerald-500 mb-6 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-2xl font-bold text-slate-950">
                  A
                </div>
                <h3 className="text-nordic-secondary font-bold tracking-[0.2em] text-sm uppercase">Avyra</h3>
                <p className="text-[10px] text-nordic-highlight mt-2 uppercase tracking-widest font-medium">Founder Edition</p>
                
                <div className="absolute bottom-8 w-full px-8 flex justify-between items-end opacity-40">
                  <div className="h-8 w-10 rounded bg-gradient-to-r from-yellow-200 to-yellow-500 opacity-80"></div>
                  <div className="text-[10px] font-mono text-nordic-highlight">((( • )))</div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* --- 2. PROBLEMET (IGENKÄNNING) -> NY DESIGN --- */}
        <section className="py-24 md:py-32 border-t border-nordic-highlight/40/50">
          <div className="max-w-6xl mx-auto space-y-24">
            
            <div className="max-w-3xl mx-auto text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-nordic-secondary leading-tight">
                Du är inte samma person <br/> <span className="text-nordic-highlight">i alla sammanhang.</span>
                </h2>
                <p className="text-xl text-nordic-highlight leading-relaxed font-light">
                    Ändå använder vi oftast ett och samma gamla sätt att dela vilka vi är.
                    AVYRA löser den digitala &quot;kodväxlingen&quot; åt dig.
                </p>
            </div>

            {/* Ny kort-grid baserad på feedback */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 px-4 relative z-10">
                {[
                  { name: "LinkedIn", color: "sky", desc: "Professionella kontakter & CV", visual: "border-sky-500/30 bg-sky-950/20 text-sky-300" },
                  { name: "Instagram", color: "purple", desc: "Vänner, följare & fans", visual: "border-purple-500/30 bg-purple-950/20 text-purple-300" },
                  { name: "Visitkort", color: "amber", desc: "Gammalt/Fel info?", visual: "border-amber-500/30 bg-amber-950/20 text-amber-300" },
                  { name: "Fel version", color: "red", desc: "Och ibland delar du fel.", visual: "border-red-500/40 bg-red-950/30 text-red-300" }
                ].map((item, i) => (
                  <div key={i} className={`relative p-8 rounded-[2rem] border overflow-hidden backdrop-blur-sm group hover:-translate-y-2 transition-transform duration-300 flex flex-col justify-end h-56 ${item.visual} ${i % 2 === 0 ? 'lg:translate-y-6' : ''}`}>
                    {/* Abstrakt bakgrundseffekt inuti kortet */}
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    
                    {/* Grafiskt element inuti kortet */}
                    <div className={`absolute top-6 left-6 h-12 w-12 rounded-xl bg-nordic-primary/60 border border-white/5 flex items-center justify-center text-3xl shadow-inner shadow-white/5`}>
                      {i === 0 && <span className="bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent font-black tracking-tight">in</span>}
                      {i === 1 && <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-black tracking-tight">IG</span>}
                      {i === 2 && <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent font-black tracking-tight">vC</span>}
                      {i === 3 && <span className="text-red-400 font-black tracking-tight">⚠️</span>}
                    </div>

                    <div className="relative z-10 space-y-1">
                      <div className="text-xs uppercase font-bold tracking-widest text-nordic-highlight">Ibland delar du...</div>
                      <h3 className="text-2xl font-bold tracking-tight text-nordic-secondary">{item.name}</h3>
                      <p className={`text-sm italic font-medium ${item.name === "Fel version" ? "text-red-400" : "text-amber-400"}`}>{item.desc}</p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Lösning Highlight - Ny design */}
            <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <div className="inline-flex relative items-center gap-3 px-8 py-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-2xl shadow-emerald-500/5">
                    <div className="absolute -inset-1 bg-emerald-500/10 blur-xl rounded-full" />
                    <Zap size={18}/>
                    <p className="relative text-xl md:text-2xl font-medium">
                        AVYRA ger dig full kontroll över hur du syns.
                    </p>
                </div>
            </div>
          </div>
        </section>


        {/* --- 3. KÄRNKONCEPTET (VISUAL SPLIT) --- */}
        <section className="bg-slate-900/30 rounded-[3rem] border border-nordic-highlight/40 p-8 md:p-16 overflow-hidden relative">
            {/* Bakgrundseffekter */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-800/30 via-transparent to-transparent opacity-50" />
            
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                        <Layers size={14} className="text-emerald-400" />
                        <span>KÄRNKONCEPTET</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-nordic-secondary leading-tight">
                        En identitet. <br/>
                        <span className="text-nordic-highlight">Flera sidor av dig.</span>
                    </h2>
                    <p className="text-lg text-nordic-highlight leading-relaxed max-w-md">
                        AVYRA är byggt för hur människor faktiskt nätverkar idag.
                        Ett ställe för allt – men aldrig allt på samma gång.
                        Du bestämmer vad som visas. We see till att det känns rätt.
                    </p>
                    
                    {/* Feature list */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400"><Users size={20}/></div>
                            <div>
                                <div className="text-nordic-secondary font-bold">Social Vy</div>
                                <div className="text-sm text-nordic-highlight">För vänner, följare & fans</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><ShieldCheck size={20}/></div>
                            <div>
                                <div className="text-nordic-secondary font-bold">Business Vy</div>
                                <div className="text-sm text-nordic-highlight">För kunder, partners & rekryterare</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VISUAL: Split Screen Mockup (Abstrakt UI) */}
                <div className="relative h-[400px] w-full flex items-center justify-center">
                    {/* Vänster kort (Social) */}
                    <div className="absolute left-0 top-8 w-64 h-80 bg-slate-900 border border-nordic-highlight/40 rounded-2xl shadow-2xl rotate-[-6deg] z-10 p-4 hover:z-30 hover:rotate-0 transition-all duration-300">
                        <div className="h-full w-full bg-nordic-primary rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-center mb-2">
                                <div className="h-8 w-8 rounded-full bg-sky-500/20" />
                                <div className="h-2 w-12 bg-slate-800 rounded-full" />
                            </div>
                            <div className="h-32 w-full bg-sky-500/10 rounded-lg" />
                            <div className="flex gap-2">
                                <div className="h-12 w-12 rounded-lg bg-slate-800" />
                                <div className="h-12 w-12 rounded-lg bg-slate-800" />
                                <div className="h-12 w-12 rounded-lg bg-slate-800" />
                            </div>
                        </div>
                        <div className="absolute -top-3 -right-3 bg-sky-500 text-xs font-bold px-3 py-1 rounded-full text-nordic-secondary shadow-lg">SOCIAL</div>
                    </div>

                    {/* Höger kort (Business) */}
                    <div className="absolute right-0 bottom-8 w-64 h-80 bg-slate-900 border border-nordic-highlight/40 rounded-2xl shadow-2xl rotate-[6deg] z-20 p-4 hover:z-30 hover:rotate-0 transition-all duration-300">
                        <div className="h-full w-full bg-nordic-primary rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-full bg-emerald-500/20" />
                                <div>
                                    <div className="h-2 w-20 bg-slate-700 rounded-full mb-1" />
                                    <div className="h-2 w-12 bg-slate-800 rounded-full" />
                                </div>
                            </div>
                            <div className="h-10 w-full bg-slate-800 rounded-lg flex items-center px-3">
                                <div className="h-2 w-16 bg-slate-700 rounded-full" />
                            </div>
                            <div className="h-10 w-full bg-emerald-600 rounded-lg flex items-center justify-center">
                                <div className="h-2 w-24 bg-emerald-900/30 rounded-full" />
                            </div>
                        </div>
                        <div className="absolute -top-3 -left-3 bg-emerald-500 text-xs font-bold px-3 py-1 rounded-full text-nordic-secondary shadow-lg">BUSINESS</div>
                    </div>
                </div>
            </div>
        </section>


        {/* --- 4. HUR DET FUNKAR --- */}
        <section id="how-it-works" className="py-12 scroll-mt-24">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold text-nordic-secondary sm:text-4xl">Så enkelt är det.</h2>
            <p className="text-nordic-highlight">Ingen app krävs för den du möter.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Skapa din profil",
                desc: "Lägg till det som representerar dig. Bilder, länkar, bio.",
                icon: "🎨"
              },
              {
                step: "2",
                title: "Välj vy",
                desc: "Anpassa efter situation – privat fest eller affärsmöte.",
                icon: "🔄"
              },
              {
                step: "3",
                title: "Blippa & Dela",
                desc: "Håll kortet mot en mobil eller dela din QR-kod. Klart.",
                icon: "✨"
              }
            ].map((item, i) => (
              <div key={i} className="relative group p-8 rounded-3xl border border-nordic-highlight/40 bg-slate-900/40 hover:bg-slate-900 transition-colors">
                <div className="absolute -top-6 left-8 h-12 w-12 rounded-xl bg-slate-800 border border-nordic-highlight/40 flex items-center justify-center text-xl shadow-xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-slate-800 absolute right-4 top-4 select-none">{item.step}</span>
                  <h3 className="text-xl font-bold text-nordic-secondary mb-3 relative z-10">{item.title}</h3>
                  <p className="text-nordic-highlight text-sm leading-relaxed relative z-10">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* --- 5. HUVUD-CTA --- */}
        <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-emerald-950 to-slate-950 border border-emerald-900/30 p-12 md:p-24 text-center">
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-nordic-secondary leading-tight">
              Redo att sluta dela <br/> fel version av dig?
            </h2>
            <p className="text-nordic-highlight text-lg">
              Skapa din profil idag och upplev hur enkelt nätverkande kan vara.
              Ingen betalning. Inget kort. Börja direkt.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/get-started"
                className="inline-flex h-14 items-center justify-center rounded-full bg-emerald-500 px-10 text-base font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:scale-105"
              >
                Skapa gratis profil
              </Link>
            </div>
            
            <div className="pt-8 flex justify-center gap-8 text-sm font-medium text-nordic-highlight">
              <Link href="/social" className="hover:text-emerald-400 transition-colors">Utforska Social →</Link>
              <Link href="/business" className="hover:text-emerald-400 transition-colors">Utforska Business →</Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}