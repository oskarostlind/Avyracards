import Link from "next/link";
import { Check, ArrowRight, Instagram, Music, Share2, Wallet, QrCode, Smartphone } from "lucide-react";

export default function SocialLandingPage() {
  return (
    <main className="min-h-screen bg-nordic-primary text-nordic-secondary selection:bg-sky-500/30 overflow-hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-4 pb-24 pt-20 md:px-8">
        
        {/* --- 1. HERO SECTION --- */}
        <section className="grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 text-xs font-bold text-sky-300">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              Avyra Social
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl font-extrabold tracking-tight text-nordic-secondary sm:text-6xl lg:text-7xl leading-[1.05]">
                Dela dina länkar. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                  På ditt sätt.
                </span>
              </h1>
              <p className="max-w-lg text-lg text-nordic-highlight leading-relaxed font-light">
                Samla Instagram, Snapchat, Spotify, länkar och kontaktuppgifter på ett ställe.
                Dela med mobilen – eller med ett NFC-kort om du vill.
              </p>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap gap-4">
                <Link
                    href="/register"
                    className="rounded-2xl bg-sky-500 px-8 py-4 text-base font-bold text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.3)] transition hover:bg-sky-400 hover:scale-105 active:scale-95"
                >
                    Skapa gratis sida
                </Link>
                <Link
                    href="#how-it-works"
                    className="inline-flex items-center rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 px-8 py-4 text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-nordic-secondary transition"
                >
                    Se hur det funkar <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                </div>

                 {/* Trust Microcopy */}
                 <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-nordic-highlight">
                    <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-sky-500" /> Gratis att börja</span>
                    <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-sky-500" /> Ingen app krävs</span>
                    <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-sky-500" /> NFC-kort är valfritt</span>
                </div>
            </div>
          </div>

          {/* SOCIAL PHONE MOCKUP (VARDAGLIG KÄNSLA) */}
          <div className="relative flex justify-center lg:justify-end animate-in fade-in zoom-in duration-1000 delay-200">
             {/* Bakgrunds-blob */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-sky-500/20 rounded-full blur-[100px] opacity-60 pointer-events-none" />

             <div className="relative w-[320px] h-[640px] bg-nordic-primary rounded-[3.5rem] border-[8px] border-nordic-highlight/30 shadow-2xl overflow-hidden rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
               {/* Notch */}
               <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-slate-900 rounded-full z-20" />
               
               {/* Screen Content */}
               <div className="h-full w-full bg-nordic-primary overflow-y-auto hide-scrollbar relative">
                 
                 {/* Header Image */}
                 <div className="h-40 w-full bg-[url('https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/90" />
                 </div>

                 <div className="px-6 -mt-16 flex flex-col items-center relative z-10">
                   <div className="h-24 w-24 rounded-full border-4 border-slate-950 bg-slate-800 p-1">
                       {/* Avatar */}
                       <div className="h-full w-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl shadow-inner">
                         🎧
                       </div>
                   </div>
                   
                   <h3 className="mt-3 text-xl font-bold text-nordic-secondary">Alex Music</h3>
                   <p className="text-sm text-nordic-highlight text-center mt-1 px-2 font-light">
                     DJ & Producer from Stockholm. <br/> New mix out now! 👇
                   </p>
                   
                   {/* Social Icons Row - FIXAT HÄR */}
                   <div className="flex gap-4 mt-6">
                     {[Instagram, Music, Share2].map((Icon, i) => (
                       <div key={i} className="h-10 w-10 rounded-full bg-slate-900 border border-nordic-highlight/40 hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-400 transition-colors flex items-center justify-center text-nordic-highlight cursor-pointer shadow-sm">
                         <Icon size={18} />
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Links Stack */}
                 <div className="px-5 mt-8 space-y-3 pb-8">
                   {["Lyssna på Spotify", "Kommande Spelningar", "Boka mig", "Min Soundcloud"].map((label, i) => (
                     <div key={i} className="group w-full p-4 rounded-2xl bg-slate-900 border border-nordic-highlight/40 hover:border-sky-500/30 hover:shadow-[0_0_15px_rgba(14,165,233,0.1)] transition-all cursor-pointer flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200">{label}</span>
                     </div>
                   ))}
                   
                   {/* Spotify Embed Fake */}
                   <div className="w-full p-3 rounded-2xl bg-[#1DB954]/10 border border-[#1DB954]/20 mt-4 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-[#1DB954]/20 flex items-center justify-center text-[#1DB954]"><Music size={20}/></div>
                      <div>
                          <div className="h-2 w-24 bg-[#1DB954]/30 rounded-full mb-1.5"/>
                          <div className="h-1.5 w-16 bg-[#1DB954]/20 rounded-full"/>
                      </div>
                   </div>
                 </div>

               </div>
             </div>
          </div>
        </section>


        {/* --- 2. PROBLEMET (VARDAGLIG IGENKÄNNING) --- */}
        <section className="py-16 border-t border-nordic-highlight/40/50">
          <div className="max-w-3xl mx-auto text-center space-y-12">
            <div className="space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold text-nordic-secondary">
                 Det borde vara enklare <br/> att dela vem du är.
                </h2>
                <div className="text-lg md:text-xl text-nordic-highlight space-y-2 leading-relaxed font-light">
                    <p>Ibland vill du dela <span className="text-sky-400 font-medium">Instagram</span>.</p>
                    <p>Ibland <span className="text-yellow-400 font-medium">Snapchat</span>.</p>
                    <p>Ibland bara ditt nummer.</p>
                    <p className="pt-4 italic text-nordic-highlight">Men istället letar du efter rätt app – eller förklarar hur man ska hitta dig.</p>
                </div>
            </div>
            
            {/* Lösning Highlight */}
            <div className="bg-slate-900/50 border border-nordic-highlight/40 rounded-2xl p-6 md:p-8 inline-block max-w-2xl mx-auto">
                 <p className="text-lg md:text-xl text-slate-200">
                    <span className="font-bold text-nordic-secondary">AVYRA</span> samlar allt du vill dela på ett ställe. <br/>
                    Redo i fickan – när du behöver det.
                 </p>
            </div>
          </div>
        </section>


        {/* --- 3. VAD DU KAN DELA --- */}
        <section className="bg-slate-900/30 rounded-[3rem] border border-nordic-highlight/40 p-8 md:p-16 relative overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
                <div className="space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold text-nordic-secondary leading-tight">
                        Dela det som <br/> är <span className="text-sky-400">du.</span>
                    </h2>
                    
                    <ul className="space-y-4 text-lg text-nordic-highlight">
                        <li className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-sky-400"/> Sociala medier
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-purple-400"/> Musik, länkar, favoriter
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-400"/> Kontaktuppgifter
                        </li>
                    </ul>

                    <p className="text-nordic-highlight italic border-l-2 border-nordic-highlight/40 pl-4 py-1">
                        Precis det du vill – inget mer. <br/>
                        Du ändrar när som helst. Samma sida fungerar alltid.
                    </p>
                </div>

                {/* VISUAL: Content Examples */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Kort 1 */}
                    <div className="bg-nordic-primary p-4 rounded-2xl border border-nordic-highlight/40 rotate-[-3deg] hover:rotate-0 transition-transform">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">🎓</div>
                            <div>
                                <div className="text-xs text-nordic-highlight font-bold uppercase">Student</div>
                                <div className="text-nordic-secondary font-medium">Portfolio</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-800 rounded-full"/>
                            <div className="h-2 w-2/3 bg-slate-800 rounded-full"/>
                        </div>
                    </div>

                    {/* Kort 2 */}
                    <div className="bg-nordic-primary p-4 rounded-2xl border border-nordic-highlight/40 rotate-[3deg] hover:rotate-0 transition-transform mt-8">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">✈️</div>
                            <div>
                                <div className="text-xs text-nordic-highlight font-bold uppercase">Resenär</div>
                                <div className="text-nordic-secondary font-medium">Mina guider</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-800 rounded-full"/>
                            <div className="h-2 w-2/3 bg-slate-800 rounded-full"/>
                        </div>
                    </div>
                     {/* Kort 3 */}
                     <div className="bg-nordic-primary p-4 rounded-2xl border border-nordic-highlight/40 rotate-[-2deg] hover:rotate-0 transition-transform col-span-2 w-2/3 mx-auto">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">👋</div>
                            <div>
                                <div className="text-xs text-nordic-highlight font-bold uppercase">Vän</div>
                                <div className="text-nordic-secondary font-medium">Bara jag</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-800 rounded-full"/>
                        </div>
                    </div>
                </div>
            </div>
        </section>


        {/* --- 4. SÅ DELAR DU (TRE SÄTT) --- */}
        <section id="how-it-works" className="py-12">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold text-nordic-secondary sm:text-4xl">Välj det som passar dig.</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Med mobilen",
                desc: "Visa din QR-kod direkt i appen eller dela din unika länk.",
                icon: <QrCode size={32} className="text-sky-400" />
              },
              {
                title: "Med Wallet",
                desc: "Ha din profil redo i Apple Wallet eller Google Wallet. Alltid ett dubbelklick bort.",
                icon: <Wallet size={32} className="text-purple-400" />
              },
              {
                title: "Med NFC-kort",
                desc: "Blippa kortet mot mobilen och dela direkt – utan appar.",
                icon: <Smartphone size={32} className="text-emerald-400" />
              }
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-3xl border border-nordic-highlight/40 bg-slate-900/40 hover:bg-slate-900 transition-all text-center">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-nordic-secondary mb-3">{item.title}</h3>
                <p className="text-nordic-highlight text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>


        {/* --- 5. NFC TEASER (VALFRITT) --- */}
        <section className="grid md:grid-cols-2 gap-12 items-center py-12 border-t border-nordic-highlight/40/50">
            <div className="order-2 md:order-1">
                <div className="relative w-full aspect-video bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-nordic-highlight/40 flex items-center justify-center overflow-hidden group">
                     {/* Simulerat kort */}
                     <div className="w-48 h-32 bg-slate-100 rounded-xl shadow-2xl transform rotate-[-12deg] group-hover:rotate-0 transition-transform duration-500 flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full bg-sky-500 text-nordic-secondary flex items-center justify-center font-bold">A</div>
                     </div>
                </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                    NFC
                </div>
                <h2 className="text-3xl font-bold text-nordic-secondary">Vill du dela ännu snabbare?</h2>
                <p className="text-lg text-nordic-highlight leading-relaxed font-light">
                    Med ett AVYRA-kort kan du dela din profil med ett enkelt blipp.
                    Perfekt när du möter nya människor – utan att leta efter rätt länk.
                    <br/><br/>
                    Kortet är kopplat till din sida. Ändra innehållet när du vill.
                </p>
                <div className="pt-2">
                    <span className="text-sm font-medium text-nordic-highlight">Finns som tillval inuti dashboarden.</span>
                </div>
            </div>
        </section>


        {/* --- 6. HUVUD-CTA --- */}
        <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-sky-950 to-slate-950 border border-sky-900/30 p-12 md:p-24 text-center mt-8">
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-nordic-secondary leading-tight">
              Redo att göra det enklare?
            </h2>
            <p className="text-nordic-highlight text-lg">
              Skapa din sida idag och börja dela på ditt sätt. <br/>
              Med mobil – eller med NFC-kort om du vill.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-sky-500 px-10 text-base font-bold text-slate-950 shadow-xl shadow-sky-500/20 transition-all hover:bg-sky-400 hover:scale-105"
              >
                Skapa gratis sida
              </Link>
            </div>
            <p className="text-xs text-nordic-highlight font-medium">Tar mindre än 2 minuter.</p>
            
            <div className="pt-12 flex justify-center gap-6 text-sm text-nordic-highlight border-t border-nordic-highlight/40/50 w-fit mx-auto mt-8 px-8">
               <Link href="/social" className="hover:text-nordic-secondary transition-colors">För kreatörer</Link>
               <span className="text-slate-700">•</span>
               <Link href="/business" className="hover:text-nordic-secondary transition-colors">För företag</Link>
               <span className="text-slate-700">•</span>
               <Link href="/login" className="hover:text-nordic-secondary transition-colors">Logga in</Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}