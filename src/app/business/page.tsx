import Link from "next/link";
import { Check, ArrowRight, Save, Mail, Phone, BarChart3, Smartphone, QrCode, Wallet, Layers, Lock, ShieldCheck } from "lucide-react";

export default function BusinessLandingPage() {
  return (
    <main className="min-h-screen bg-nordic-primary text-nordic-secondary selection:bg-emerald-500/30 overflow-hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-4 pb-24 pt-20 md:px-8">
        
        {/* --- 1. HERO SECTION (POSITIONERING) --- */}
        <section className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          
          {/* TEXT CONTENT */}
          <div className="space-y-8 order-2 lg:order-1 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-4 py-1.5 text-xs font-semibold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Avyra Business
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight text-nordic-secondary sm:text-5xl lg:text-6xl leading-[1.05]">
                Ett visitkort som <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  faktiskt fungerar.
                </span>
              </h1>
              <p className="max-w-xl text-lg text-nordic-highlight leading-relaxed font-light">
                Avyra Business är ditt digitala visitkort – alltid uppdaterat, alltid professionellt och redo att delas på sekunder.
                Perfekt för möten, kundkontakter och nätverkande.
              </p>
            </div>

            <div className="flex flex-col gap-6">
                 <div className="flex flex-wrap gap-4">
                    <Link
                        href="/register?mode=business"
                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-8 py-4 text-base font-bold text-nordic-secondary shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-500 hover:scale-105 active:scale-95"
                    >
                        Skapa business-profil gratis
                    </Link>
                    <Link
                        href="#how-it-works"
                        className="inline-flex items-center justify-center rounded-2xl border border-nordic-highlight/40 bg-transparent px-8 py-4 text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-nordic-secondary transition"
                    >
                        Se hur det funkar <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                 </div>

                 {/* Trust Microcopy */}
                 <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-nordic-highlight">
                    <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Gratis att börja</span>
                    <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Anpassat för proffs</span>
                    <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> NFC-kort är valfritt</span>
                </div>
            </div>
          </div>

          {/* BUSINESS PHONE MOCKUP (KONTROLLERAD & PREMIUM) */}
          <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end animate-in fade-in zoom-in duration-1000 delay-200">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/10 rounded-full blur-[100px] opacity-60 pointer-events-none" />

             <div className="relative w-[320px] h-[640px] bg-slate-900 rounded-[3rem] border-[8px] border-nordic-highlight/40 shadow-2xl overflow-hidden rotate-[2deg] hover:rotate-0 transition-transform duration-500">
               {/* Notch */}
               <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-slate-800 rounded-full z-20" />
               
               <div className="h-full w-full bg-nordic-primary overflow-y-auto hide-scrollbar relative">
                 {/* Business Header */}
                 <div className="h-44 bg-slate-900 w-full relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-slate-900/90"></div>
                   {/* Geometriskt mönster */}
                   <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-bl-[100px]" />
                 </div>
                 
                 <div className="px-6 relative -mt-20">
                   {/* Profilbild */}
                   <div className="h-28 w-28 rounded-full border-4 border-slate-950 bg-slate-800 shadow-xl overflow-hidden flex items-center justify-center text-5xl relative z-10">
                     👔
                   </div>
                   
                   <div className="mt-5 space-y-1">
                     <h3 className="text-2xl font-bold text-nordic-secondary">Erik Svensson</h3>
                     <p className="text-emerald-400 font-medium tracking-wide">Sales Director</p>
                     <p className="text-nordic-highlight text-sm">TechSolutions AB</p>
                   </div>

                   {/* Main Action (Spara Kontakt) */}
                   <div className="mt-8">
                      <button className="w-full bg-nordic-secondary text-nordic-primary h-14 rounded-xl font-bold shadow-lg shadow-white/5 flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] hover:bg-nordic-support">
                         <Save size={20} className="text-emerald-600" />
                         <span>Spara Kontakt</span>
                      </button>
                   </div>

                   {/* Quick Actions Grid */}
                   <div className="grid grid-cols-2 gap-3 mt-4">
                     <button className="bg-slate-900 h-12 rounded-xl text-slate-300 text-sm font-medium border border-nordic-highlight/40 flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-nordic-secondary transition-colors">
                       <Mail size={16}/> Maila
                     </button>
                     <button className="bg-slate-900 h-12 rounded-xl text-slate-300 text-sm font-medium border border-nordic-highlight/40 flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-nordic-secondary transition-colors">
                       <Phone size={16}/> Ring
                     </button>
                   </div>

                   {/* Professional Links */}
                   <div className="mt-8 space-y-3 pb-8">
                     <div className="p-4 rounded-xl bg-slate-900/50 border border-nordic-highlight/40 flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-colors group">
                       <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-lg bg-[#0077b5]/10 text-[#0077b5] flex items-center justify-center font-bold">in</div>
                         <div className="text-sm font-medium text-slate-200">Connect på LinkedIn</div>
                       </div>
                       <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors"/>
                     </div>
                     <div className="p-4 rounded-xl bg-slate-900/50 border border-nordic-highlight/40 flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-colors group">
                       <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">📅</div>
                         <div className="text-sm font-medium text-slate-200">Boka ett möte</div>
                       </div>
                       <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors"/>
                     </div>
                     <div className="p-4 rounded-xl bg-slate-900/50 border border-nordic-highlight/40 flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-colors group">
                       <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-lg bg-slate-800 text-nordic-highlight flex items-center justify-center font-bold">🌐</div>
                         <div className="text-sm font-medium text-slate-200">Besök hemsida</div>
                       </div>
                       <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors"/>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </section>


        {/* --- 2. PROBLEMET (PROFESSIONELL IGENKÄNNING) --- */}
        <section className="py-16 border-t border-nordic-highlight/40/50">
          <div className="max-w-3xl mx-auto text-center space-y-12">
            <div className="space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold text-nordic-secondary">
                 Visitkort räcker inte längre.
                </h2>
                <div className="text-lg md:text-xl text-nordic-highlight space-y-2 leading-relaxed font-light">
                    <p>Papperskort blir <span className="text-slate-300">gamla</span>.</p>
                    <p>PDF:er <span className="text-slate-300">tappas bort</span>.</p>
                    <p>Profiler är utspridda.</p>
                    <p className="pt-4 italic text-nordic-highlight">Och när du väl delar – är det inte säkert att det leder någonstans.</p>
                </div>
            </div>
            
            {/* Lösning Highlight */}
            <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-6 md:p-8 inline-block max-w-2xl mx-auto">
                 <p className="text-lg md:text-xl text-emerald-100">
                    <span className="font-bold text-emerald-400">AVYRA</span> samlar allt som är relevant i ett professionellt sammanhang. <br/>
                    Alltid uppdaterat. Alltid rätt.
                 </p>
            </div>
          </div>
        </section>


        {/* --- 3. VAD AVYRA BUSINESS GÖR (FEATURES) --- */}
        <section className="bg-slate-900/30 rounded-[3rem] border border-nordic-highlight/40 p-8 md:p-16 relative overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
                <div className="space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold text-nordic-secondary leading-tight">
                        Allt som hör jobbet till. <br/>
                        <span className="text-emerald-400">På ett ställe.</span>
                    </h2>
                    
                    <ul className="space-y-6 text-lg text-nordic-highlight">
                        <li className="flex items-start gap-4">
                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mt-1"><Save size={14}/></div>
                            <div>
                                <span className="text-nordic-secondary block font-medium">Dela kontaktuppgifter direkt</span>
                                <span className="text-sm">En knapp sparar dig i kundens telefonbok.</span>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mt-1"><Layers size={14}/></div>
                             <div>
                                <span className="text-nordic-secondary block font-medium">Visa professionell info</span>
                                <span className="text-sm">LinkedIn, hemsida, och företagsinformation.</span>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mt-1"><ShieldCheck size={14}/></div>
                             <div>
                                <span className="text-nordic-secondary block font-medium">Alltid uppdaterat</span>
                                <span className="text-sm">Bytt titel? Ändra i profilen – länken är densamma.</span>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* VISUAL: Clean UI Cards */}
                <div className="relative h-[400px] w-full flex items-center justify-center">
                    <div className="absolute w-72 bg-nordic-primary border border-nordic-highlight/40 rounded-2xl shadow-2xl p-6 rotate-[-2deg] hover:rotate-0 transition-transform duration-500 z-10">
                        <div className="flex justify-between items-center mb-6">
                             <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center text-2xl">💼</div>
                             <div className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase">Verified</div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse"></div>
                            <div className="h-3 w-1/2 bg-slate-800/50 rounded"></div>
                        </div>
                        <div className="mt-8 grid grid-cols-3 gap-2">
                             <div className="h-10 bg-slate-900 rounded-lg border border-nordic-highlight/40"></div>
                             <div className="h-10 bg-slate-900 rounded-lg border border-nordic-highlight/40"></div>
                             <div className="h-10 bg-slate-900 rounded-lg border border-nordic-highlight/40"></div>
                        </div>
                        <div className="mt-4 h-12 bg-nordic-primary/70 border border-nordic-support rounded-lg w-full flex items-center justify-center">
                            <div className="h-2 w-24 bg-nordic-highlight/40 rounded-full"></div>
                        </div>
                    </div>
                     {/* Bakgrundskort för djup */}
                     <div className="absolute w-72 h-64 bg-slate-900 border border-nordic-highlight/40 rounded-2xl opacity-50 rotate-[4deg] scale-95 -z-0"></div>
                </div>
            </div>
        </section>


        {/* --- 4. DELA I ALLA SITUATIONER --- */}
        {/* FIX: Lade till scroll-mt-24 här */}
        <section id="how-it-works" className="py-12 scroll-mt-24">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold text-nordic-secondary sm:text-4xl">Redo när mötet händer.</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "NFC-kort",
                desc: "Blippa kortet mot mobilen och dela direkt. Professionellt och minnesvärt.",
                icon: <Smartphone size={32} className="text-emerald-400" />
              },
              {
                title: "QR-kod",
                desc: "Perfekt på skärm, i slutet av din presentation eller på mässa.",
                icon: <QrCode size={32} className="text-slate-300" />
              },
              {
                title: "Wallet",
                desc: "Ha ditt visitkort redo i Apple Wallet eller Google Wallet.",
                icon: <Wallet size={32} className="text-indigo-400" />
              }
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-3xl border border-nordic-highlight/40 bg-slate-900/40 hover:bg-slate-900 transition-all text-center">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-nordic-secondary mb-3">{item.title}</h3>
                <p className="text-nordic-highlight text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>


        {/* --- 5. NFC BUSINESS CARD --- */}
        <section className="grid md:grid-cols-2 gap-12 items-center py-16 border-t border-nordic-highlight/40/50">
            <div className="order-2 md:order-1">
                <div className="relative w-full aspect-video bg-gradient-to-br from-slate-950 to-slate-900 rounded-3xl border border-nordic-highlight/40 flex items-center justify-center overflow-hidden group">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent opacity-50"></div>
                     {/* Simulerat Premium-kort */}
                     <div className="w-64 h-40 bg-gradient-to-br from-slate-800 to-black rounded-xl shadow-2xl transform rotate-[-6deg] group-hover:rotate-0 transition-all duration-700 flex flex-col justify-between p-6 border border-nordic-highlight/40/50">
                        <div className="flex justify-between items-start">
                             <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center font-serif text-nordic-secondary/50 text-xs">A</div>
                             <div className="text-[10px] text-nordic-secondary/30 tracking-widest uppercase font-mono">Business</div>
                        </div>
                        <div className="text-right">
                            <div className="text-nordic-secondary/20 text-xs font-mono">Erik Svensson</div>
                        </div>
                     </div>
                </div>
            </div>
            <div className="space-y-8 order-1 md:order-2">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 mb-4">
                        HÅLLBARHET & DESIGN
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-nordic-secondary mb-4">Ett kort som representerar dig.</h2>
                    <p className="text-lg text-nordic-highlight leading-relaxed font-light">
                        AVYRA Business-kortet är kopplat till din profil.
                        När du uppdaterar din information uppdateras kortet automatiskt.
                    </p>
                </div>
                
                <ul className="space-y-3 text-nordic-highlight">
                    <li className="flex items-center gap-3"><Check size={16} className="text-emerald-500"/> Inga nytryck vid titelbyte</li>
                    <li className="flex items-center gap-3"><Check size={16} className="text-emerald-500"/> Inga gamla inaktuella uppgifter</li>
                    <li className="flex items-center gap-3"><Check size={16} className="text-emerald-500"/> Premiumkänsla i varje överlämning</li>
                </ul>

                <button className="text-nordic-secondary border-b border-white pb-0.5 hover:text-emerald-400 hover:border-emerald-400 transition-colors text-sm font-medium">
                    Beställ business-kort →
                </button>
            </div>
        </section>


        {/* --- 6. STATISTIK & UPPFÖLJNING --- */}
        <section className="py-16 grid md:grid-cols-2 gap-12 items-center">
             <div className="space-y-6">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <BarChart3 size={24} />
                </div>
                <h2 className="text-3xl font-bold text-nordic-secondary">Följ upp dina kontakter</h2>
                <p className="text-lg text-nordic-highlight leading-relaxed">
                    Se vad som faktiskt händer efter mötet. Få insikter om hur ditt kort används.
                    Se visningar, klick och engagemang – utan att det blir krångligt.
                </p>
             </div>
             
             <div className="bg-slate-900 border border-nordic-highlight/40 rounded-3xl p-6 md:p-8">
                 {/* Mockup Stats */}
                 <div className="space-y-6">
                     <div className="flex justify-between items-center">
                         <h4 className="text-nordic-secondary font-bold">Översikt</h4>
                         <select className="bg-slate-800 text-xs text-slate-300 rounded px-2 py-1 border border-nordic-highlight/40 outline-none">
                             <option>Senaste 30 dagar</option>
                         </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="bg-nordic-primary p-4 rounded-xl border border-nordic-highlight/40">
                             <div className="text-xs text-nordic-highlight mb-1">Visningar</div>
                             <div className="text-2xl font-mono text-nordic-secondary">1,240</div>
                             <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">▲ 12%</div>
                         </div>
                         <div className="bg-nordic-primary p-4 rounded-xl border border-nordic-highlight/40">
                             <div className="text-xs text-nordic-highlight mb-1">Sparade kontakter</div>
                             <div className="text-2xl font-mono text-nordic-secondary">86</div>
                             <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">▲ 5%</div>
                         </div>
                     </div>
                     {/* Bars */}
                     <div className="flex items-end gap-2 h-24 pt-4 border-t border-nordic-highlight/40/50">
                         {[40, 65, 30, 80, 50, 90, 60].map((h, i) => (
                             <div key={i} className="flex-1 bg-emerald-500/20 rounded-t-sm hover:bg-emerald-500/40 transition-colors relative group">
                                 <div style={{height: `${h}%`}} className="absolute bottom-0 w-full bg-emerald-500 rounded-t-sm opacity-60"></div>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
        </section>
        
        {/* --- 7. SKILT FRÅN DET PRIVATA --- */}
        <section className="text-center max-w-2xl mx-auto py-12 space-y-6">
             <div className="inline-flex items-center gap-2 text-nordic-highlight text-sm font-medium">
                 <Lock size={16} /> Integritet & Fokus
             </div>
             <h2 className="text-3xl font-bold text-nordic-secondary">Håll isär jobb och privat.</h2>
             <p className="text-nordic-highlight">
                AVYRA låter dig ha en professionell profil för jobbet – utan att blanda in privata länkar eller socialt innehåll.
                Samma konto. Tydlig separation.
             </p>
        </section>


        {/* --- 8. SLUT-CTA --- */}
        <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-900/30 p-12 md:p-24 text-center mt-8">
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-nordic-secondary leading-tight">
              Redo för ett <br/> modernare visitkort?
            </h2>
            <p className="text-nordic-highlight text-lg">
              Skapa din business-profil idag och upplev ett enklare sätt att dela kontaktuppgifter.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register?mode=business"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-emerald-600 px-10 text-base font-bold text-nordic-secondary shadow-xl shadow-emerald-900/20 transition-all hover:bg-emerald-500 hover:scale-105"
              >
                Skapa business-profil gratis
              </Link>
            </div>
            <p className="text-xs text-nordic-highlight font-medium">Tar mindre än 2 minuter.</p>
            
            <div className="pt-12 flex justify-center gap-6 text-sm text-nordic-highlight border-t border-nordic-highlight/40/50 w-fit mx-auto mt-8 px-8">
               <Link href="/social" className="hover:text-nordic-secondary transition-colors">För kreatörer</Link>
               <span className="text-slate-700">•</span>
               <Link href="/" className="hover:text-nordic-secondary transition-colors">För privatpersoner</Link>
               <span className="text-slate-700">•</span>
               <Link href="/login" className="hover:text-nordic-secondary transition-colors">Logga in</Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}