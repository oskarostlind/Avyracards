import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, CreditCard, User, Mail, Link as LinkIcon, Wand2, MapPin, Printer } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { AdminOrderActions } from "@/components/admin/order-actions";
import { DownloadPrintPdfButton } from "@/components/admin/download-print-pdf-button";
import { PackingSlip } from "@/components/admin/packing-slip"; 

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { cards: true },
  });

  if (!order) {
    return (
        <div className="min-h-screen bg-nordic-primary p-8 text-nordic-secondary">
            Order hittades inte
        </div>
    );
  }

  const hasShippingAddress = !!order.shippingLine1;
  const customerName = order.shippingName || order.companyName || "Kund";
  const cardsGenerated = order.cards.length >= order.quantity;

  return (
    <div className="min-h-screen bg-nordic-primary p-4 md:p-8 text-nordic-secondary">
      
      <PackingSlip orderId={order.id} customerName={customerName} cards={order.cards} />

      <div className="mx-auto max-w-5xl print:hidden">
        
        <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-sm text-nordic-highlight hover:text-nordic-secondary transition">
          <ArrowLeft size={16} /> Tillbaka till översikt
        </Link>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-3xl border border-nordic-highlight/40 bg-slate-900/50 p-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold font-mono">
                #{order.id.slice(-6).toUpperCase()}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-nordic-highlight text-sm">
              Skapad {new Date(order.createdAt).toLocaleString("sv-SE")}
            </p>
          </div>
          
          <div className="flex gap-2">
             {order.cards.length > 0 && (
               <div className="hidden sm:block"> 
                  <span className="flex items-center gap-2 bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium border border-nordic-highlight/40 opacity-50 cursor-default">
                    <Printer size={16} /> Ctrl + P för Följesedel
                  </span>
               </div>
             )}

             <AdminOrderActions 
                orderId={order.id} 
                currentStatus={order.status} 
                cardsGenerated={cardsGenerated}
             />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          
          {/* Vänster: KORT */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="text-purple-400" size={20} />
                  NFC-Kort ({order.cards.length} / {order.quantity})
                </h2>
              </div>
              
              {order.cards.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-nordic-highlight/40 rounded-xl bg-nordic-primary/50">
                  <div className="inline-flex p-3 rounded-full bg-slate-900 mb-3">
                    <Wand2 className="text-slate-600" size={24} />
                  </div>
                  <p className="text-slate-300 font-medium">Inga koder genererade</p>
                  <p className="text-sm text-nordic-highlight mt-1">
                    Tryck på &quot;Generera Koder&quot; för att skapa unika länkar.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {order.cards.map((card) => {
                    const nfcUrl = `https://avyracards.se/c/${card.cardCode}`;
                    
                    return (
                      <div key={card.id} className="rounded-xl border border-nordic-highlight/40 bg-nordic-primary p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500" />
                        
                        <div className="flex justify-between items-start mb-4 pl-3">
                          <div>
                            <p className="text-xs text-nordic-highlight uppercase tracking-wider font-bold mb-1">Kortkod</p>
                            <span className="font-mono text-2xl font-bold text-nordic-secondary tracking-widest">{card.cardCode}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold border ${card.status === 'CLAIMED' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-slate-800 text-nordic-highlight border-nordic-highlight/40'}`}>
                            {card.status}
                          </span>
                        </div>

                        {/* NYTT: Färg och Material! */}
                        <div className="pl-3 mb-4 grid grid-cols-2 gap-2">
                           <div>
                              <p className="text-[10px] text-nordic-highlight uppercase tracking-widest">Material</p>
                              <p className="text-sm font-medium capitalize text-slate-200">{card.material || "Ej angivet"}</p>
                           </div>
                           <div>
                              <p className="text-[10px] text-nordic-highlight uppercase tracking-widest">Färg</p>
                              <p className="text-sm font-medium capitalize text-slate-200">{card.colorOption || "Ej angivet"}</p>
                           </div>
                           {/* Visas bara om kunden har laddat upp en logotyp */}
                           {card.printFileUrl && (
                             <div className="col-span-2 mt-2 flex flex-wrap items-center gap-2">
                               <p className="text-[10px] text-nordic-highlight uppercase tracking-widest w-full mb-0.5">Custom Print</p>
                               <a href={card.printFileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition">
                                 <LinkIcon size={12} /> Originalfil
                               </a>
                               <DownloadPrintPdfButton cardId={card.id} />
                             </div>
                           )}
                        </div>

                        <div className="pl-3 p-3 bg-slate-900/80 rounded-lg border border-nordic-highlight/40 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <LinkIcon size={12} className="text-blue-400" />
                                <span className="text-[10px] uppercase text-blue-400 font-bold">NFC URL</span>
                            </div>
                            <code className="text-sm text-slate-300 block truncate font-mono select-all">
                              {nfcUrl}
                            </code>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Höger: KUND & ADRESS */}
          <div className="space-y-6">
            
            <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-6">
               <h2 className="text-xs font-bold text-nordic-highlight uppercase tracking-widest mb-6">Leverans</h2>
               {hasShippingAddress ? (
                 <div className="flex gap-4">
                    <div className="p-2 bg-slate-800 rounded-lg h-fit">
                       <MapPin size={20} className="text-nordic-highlight" />
                    </div>
                    <div className="text-sm text-slate-200 leading-relaxed">
                       <p className="font-bold text-nordic-secondary">{customerName}</p>
                       <p>{order.shippingLine1}</p>
                       {order.shippingLine2 && <p>{order.shippingLine2}</p>}
                       <p>{order.shippingPostalCode} {order.shippingCity}</p>
                       <p className="text-nordic-highlight text-xs mt-1 uppercase">{order.shippingCountry}</p>
                    </div>
                 </div>
               ) : (
                 <p className="text-sm text-nordic-highlight italic">
                    Ingen adress sparad i databasen för denna order.
                 </p>
               )}
            </div>

            <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-6 sticky top-6">
              <h2 className="text-xs font-bold text-nordic-highlight uppercase tracking-widest mb-6">Kontakt</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="p-2 bg-slate-800 rounded-lg h-fit">
                    <User size={20} className="text-nordic-highlight" />
                  </div>
                  <div>
                    <div className="text-xs text-nordic-highlight mb-1">Kundtyp</div>
                    <div className="font-medium text-slate-200">
                        {order.customerType === "COMPANY" ? "Företag" : "Privatperson"}
                    </div>
                    {order.companyName && <div className="text-sm text-nordic-highlight mt-1">{order.companyName}</div>}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="p-2 bg-slate-800 rounded-lg h-fit">
                    <Mail size={20} className="text-nordic-highlight" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-nordic-highlight mb-1">E-post</div>
                    <a href={`mailto:${order.customerEmail}`} className="text-sm text-purple-400 hover:text-purple-300 break-all">
                      {order.customerEmail}
                    </a>
                  </div>
                </div>

                <div className="h-px bg-slate-800" />

                <div>
                    <div className="text-xs text-nordic-highlight mb-1">Totalt belopp</div>
                    <span className="text-2xl font-bold text-nordic-secondary tracking-tight">
                        {(order.amountTotal / 100).toFixed(0)} kr
                    </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors = {
    PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    SHIPPED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[status]}`}>
      {status}
    </span>
  );
}