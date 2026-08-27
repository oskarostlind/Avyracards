import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getAdminUserDetails,
  toggleUserPremium,
  addAdminNote,
  impersonateUser
} from "@/actions/admin";
import { prisma } from "@/lib/prisma";
import { GiftOrderForm } from "@/components/admin/gift-order-form";
import { 
  User as UserIcon, 
  Crown, 
  ExternalLink, 
  ChevronLeft,
  QrCode,
  VenetianMask // Ikon för Impersonate
} from "lucide-react";
import Link from "next/link";
import { getT } from "@/i18n/server";

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const t = getT();
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  // Hämta djup data + giftbara varianter till gratisorder-formuläret
  const [user, giftableVariants] = await Promise.all([
    getAdminUserDetails(params.id),
    prisma.productVariant.findMany({
      where: { isActive: true, type: "PHYSICAL" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-nordic-primary p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* Tillbaka-länk */}
        <Link href="/admin/users" className="flex items-center gap-2 text-sm text-nordic-highlight hover:text-nordic-secondary transition-colors">
          <ChevronLeft size={16} /> {t("admin.user.backToList")}
        </Link>

        {/* --- HEADER KORT --- */}
        <div className="bg-slate-900 border border-nordic-highlight/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div className="flex gap-4">
            {/* Avatar Placeholder */}
            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center text-nordic-highlight border border-nordic-highlight/40">
               {user.avatarUrl ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
               ) : (
                 <UserIcon size={32} />
               )}
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-nordic-secondary flex items-center gap-2">
                {user.name || t("admin.users.nameless")}
                {user.isPremium && <Crown size={20} className="text-amber-400 fill-amber-400/20" />}
              </h1>
              <p className="text-nordic-highlight font-mono text-sm">@{user.username}</p>
              <p className="text-nordic-highlight text-xs mt-1">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[200px]">
             {/* PUBLIK PROFIL LÄNK */}
             <a 
               href={`/u/${user.username}`} 
               target="_blank"
               className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm font-medium transition"
             >
               <ExternalLink size={14} /> {t("admin.user.visitProfile")}
             </a>

             {/* IMPERSONATE ACTION (NYTT) */}
             <form action={async () => {
                "use server";
                await impersonateUser(user.id);
             }}>
               <button 
                 type="submit"
                 className="w-full py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-nordic-secondary shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 mb-2"
                 title={t("admin.user.impersonateTitle")}
               >
                 <VenetianMask size={16} /> {t("admin.user.impersonate")}
               </button>
             </form>

             {/* PREMIUM ACTION */}
             <form action={async () => {
                "use server";
                await toggleUserPremium(user.id, !user.isPremium);
             }}>
               <button 
                 type="submit"
                 className={`w-full py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
                    user.isPremium 
                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20" 
                    : "bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                 }`}
               >
                 {user.isPremium ? "Ta bort Premium" : "Ge Premium (Gift)"}
               </button>
             </form>
          </div>
        </div>

        {/* Gratisorder till just den här användaren — e-post + användarnamn förifyllda */}
        <GiftOrderForm
          variants={giftableVariants}
          defaultEmail={user.email ?? ""}
          defaultUsername={user.username ?? ""}
        />

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* --- INFO & STATS --- */}
          <div className="bg-slate-900 border border-nordic-highlight/40 rounded-2xl p-6 space-y-4">
             <h3 className="font-bold text-slate-200 uppercase text-xs tracking-wider border-b border-nordic-highlight/40 pb-2">{t("admin.user.statusAndInfo")}</h3>
             
             <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                   <span className="text-nordic-highlight">{t("admin.user.accountCreated")}</span>
                   <span className="text-slate-300 font-mono">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-nordic-highlight">{t("admin.user.premiumSource")}</span>
                   <span className="text-slate-300">{user.premiumSource || "-"}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-nordic-highlight">{t("admin.user.linksInProfile")}</span>
                   <span className="text-slate-300">{user._count.links} st</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-nordic-highlight">{t("admin.user.linkedCards")}</span>
                   {/* Bugfix: Använd .length istället för _count.cards eftersom vi include:ar cards */}
                   <span className="text-slate-300">{user.cards.length} st</span>
                </div>
             </div>
          </div>

          {/* --- ANTECKNINGAR (ADMIN NOTES) --- */}
          <div className="bg-slate-900 border border-nordic-highlight/40 rounded-2xl p-6 space-y-4">
             <h3 className="font-bold text-slate-200 uppercase text-xs tracking-wider border-b border-nordic-highlight/40 pb-2">{t("admin.user.internalNotes")}</h3>
             
             {/* Befintlig logg (nyast överst, append-only — se addAdminNote) */}
             {user.adminNotes ? (
               <div className="max-h-48 overflow-y-auto rounded-lg border border-nordic-highlight/20 bg-nordic-primary/60 p-3 text-sm text-slate-300 whitespace-pre-wrap">
                 {user.adminNotes}
               </div>
             ) : (
               <p className="text-xs text-nordic-highlight">{t("admin.user.noNotes")}</p>
             )}

             <form action={async (formData) => {
                "use server";
                const note = formData.get("note") as string;
                await addAdminNote(user.id, note);
             }} className="flex flex-col gap-3">
                <textarea
                  name="note"
                  placeholder={t("admin.user.notesPlaceholder")}
                  className="bg-nordic-primary border border-nordic-highlight/40 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 min-h-[80px]"
                />
                <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-nordic-secondary py-2 rounded-lg text-xs font-bold transition">
                   {t("admin.user.saveNotes")}
                </button>
             </form>
          </div>
        
        </div>

        {/* --- KOPPLADE KORT (NY SEKTION) --- */}
        <div className="bg-slate-900 border border-nordic-highlight/40 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-nordic-highlight/40 flex justify-between items-center">
             <h3 className="font-bold text-slate-200 uppercase text-xs tracking-wider">{t("admin.user.linkedCards")}</h3>
             <span className="text-xs text-nordic-highlight">{user.cards.length} st</span>
          </div>
          
          {user.cards.length === 0 ? (
            <div className="p-8 text-center text-nordic-highlight text-sm">
               {t("admin.user.noCards")}
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {user.cards.map((card) => (
                <div key={card.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center border border-nordic-highlight/40 text-nordic-highlight">
                         <QrCode size={20} />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-200 font-mono tracking-wide">{card.cardCode}</p>
                         <p className="text-xs text-nordic-highlight">
                           {card.status === "CLAIMED" ? t("admin.user.activated") : t("admin.user.notActivated")} 
                           {card.claimedAt && ` • ${new Date(card.claimedAt).toLocaleDateString()}`}
                         </p>
                      </div>
                   </div>
                   
                   <div className="text-right">
                      {card.status === "CLAIMED" && (
                        <a 
                          href={`https://avyracards.se/c/${card.cardCode}`} 
                          target="_blank"
                          className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          {t("admin.user.testLink")}
                        </a>
                      )}
                      <p className="text-[10px] text-slate-600 font-mono mt-1">ID: {card.id.slice(-6)}</p>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}