"use client";

import { useState, useTransition } from "react";
import type { User, Link as PrismaLink } from "@prisma/client";
import NextLink from "next/link";
import { 
  LayoutGrid, 
  Briefcase, 
  Eye, 
  CheckCircle2, 
  Power,
  Mail,
  ExternalLink,
  RefreshCw,
  AppWindow // Ny ikon för app
} from "lucide-react";

import { SocialView } from "@/components/dashboard/social/social-view";
import { BusinessView } from "@/components/dashboard/business/business-view";
import { ProfilePreviewModal } from "@/components/dashboard/profile-preview-modal";

type DashboardShellProps = {
  user: User & { links: PrismaLink[] };
};

// --- UPPDATERAD HJÄLPFUNKTION ---
function getEmailProviderLink(email: string) {
    // 1. Webmail (Prioriterat för desktop-användare)
    if (email.includes("@gmail")) return "https://mail.google.com/";
    if (email.includes("@outlook") || email.includes("@hotmail") || email.includes("@live")) return "https://outlook.live.com/mail/";
    if (email.includes("@yahoo")) return "https://mail.yahoo.com/";
    if (email.includes("@proton")) return "https://mail.proton.me/";
    if (email.includes("@icloud")) return "https://www.icloud.com/mail";
    
    // 2. Fallback: Försök öppna standard-appen (t.ex. Outlook, Apple Mail)
    // Detta funkar bra på mobiler, men varierar på desktop.
    return "mailto:"; 
}

export function DashboardShell({ user }: DashboardShellProps) {
  const [activeMode, setActiveMode] = useState<"SOCIAL" | "BUSINESS">(
    (user.profileMode as "SOCIAL" | "BUSINESS") ?? "SOCIAL"
  );
  
  const [viewMode, setViewMode] = useState<"SOCIAL" | "BUSINESS">(activeMode);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleActivate = () => {
    if (viewMode === activeMode) return;

    startTransition(async () => {
      setActiveMode(viewMode); 
      try {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileMode: viewMode }),
        });
      } catch (error) {
        console.error("Failed to activate profile mode", error);
        setActiveMode(activeMode); 
      }
    });
  };
  
  const verificationLink = user.email ? getEmailProviderLink(user.email) : "mailto:";
  const isGenericMailto = verificationLink === "mailto:";

  return (
    <div className="space-y-6">
      
      {/* 1. Verifierings-Banner */}
      {!user.emailVerified && (
         <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex gap-4">
                <div className="bg-blue-500/20 p-2.5 rounded-xl h-fit">
                    <Mail className="text-blue-400" size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-nordic-secondary text-sm sm:text-base">Verifiera din e-postadress</h3>
                    <p className="text-xs sm:text-sm text-nordic-highlight mt-1 leading-relaxed">
                        Vi har skickat en länk till <span className="text-nordic-secondary font-medium">{user.email}</span>. <br className="hidden sm:block"/>
                        Verifiera för att säkra ditt konto. (Du kan fortfarande använda tjänsten nu!)
                    </p>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {/* PRIMÄR KNAPP: Öppna Mail */}
                <a 
                    href={verificationLink} 
                    target={isGenericMailto ? "_self" : "_blank"} // mailto ska inte öppna ny flik
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                >
                    {isGenericMailto ? (
                        <>Öppna Mail-app <AppWindow size={14} /></>
                    ) : (
                        <>Öppna Inkorgen <ExternalLink size={14} /></>
                    )}
                </a>

                {/* SEKUNDÄR KNAPP: Skicka nytt (Liten text under eller bredvid) */}
                <NextLink 
                    href={`/verify-resend?email=${encodeURIComponent(user.email || "")}`}
                    className="w-full sm:w-auto px-4 py-2.5 bg-transparent border border-nordic-highlight/20 hover:bg-nordic-highlight/5 text-nordic-highlight text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                    <RefreshCw size={14} />
                    <span className="hidden sm:inline">Skicka nytt</span>
                </NextLink>
            </div>
         </div>
      )}

      {/* 2. Header & Controls (Oförändrad nedanför) */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        
        {/* Vänster: Titel */}
        <div>
          <h1 className="text-3xl font-bold text-nordic-secondary tracking-tight">Redigera Profil</h1>
          <p className="text-sm text-nordic-highlight mt-1">
            Hantera innehållet för din {viewMode === "SOCIAL" ? "privata" : "affärs"}profil.
          </p>
        </div>

        {/* Höger: Tabbar & Tools */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            
            {/* --- TABBAR --- */}
            <div className="flex p-1 bg-nordic-primary/70 border border-nordic-highlight/40 rounded-xl self-start sm:self-auto">
                <button
                    onClick={() => setViewMode("SOCIAL")}
                    className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        viewMode === "SOCIAL"
                        ? "bg-nordic-primary text-nordic-secondary shadow-sm ring-1 ring-nordic-highlight/30"
                        : "text-nordic-highlight hover:text-nordic-secondary hover:bg-nordic-primary/60"
                    }`}
                >
                    <LayoutGrid size={16} />
                    Social
                    {activeMode === "SOCIAL" && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                </button>
                <button
                    onClick={() => setViewMode("BUSINESS")}
                    className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        viewMode === "BUSINESS"
                        ? "bg-nordic-accent/15 text-nordic-secondary shadow-sm ring-1 ring-nordic-accent/40"
                        : "text-nordic-highlight hover:text-nordic-secondary hover:bg-nordic-primary/60"
                    }`}
                >
                    <Briefcase size={16} />
                    Business
                    {activeMode === "BUSINESS" && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                </button>
            </div>

            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

            {/* --- ACTION KNAPPAR --- */}
            <div className="flex items-center gap-2">
                {viewMode !== activeMode ? (
                  <button
                    onClick={handleActivate}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-nordic-secondary bg-slate-800 hover:bg-slate-700 border border-nordic-highlight/40 rounded-xl transition-all animate-in fade-in zoom-in-95"
                  >
                    <Power size={16} className={isPending ? "animate-spin" : ""} />
                    <span>Aktivera {viewMode === "SOCIAL" ? "Social" : "Business"}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-xl cursor-default">
                    <CheckCircle2 size={16} />
                    <span>Aktiv Profil</span>
                  </div>
                )}

                <button
                    onClick={() => setIsPreviewOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-nordic-primary bg-nordic-secondary hover:bg-nordic-support rounded-xl transition-all shadow-lg shadow-nordic-accent/10 border border-nordic-support"
                    title="Förhandsgranska profil"
                >
                    <Eye size={18} />
                    <span className="hidden sm:inline">Preview</span>
                </button>
            </div>
        </div>
      </div>

      <div className="transition-all duration-300 ease-in-out">
        {viewMode === "BUSINESS" ? (
          <BusinessView user={user} />
        ) : (
          <SocialView user={user} />
        )}
      </div>

      <ProfilePreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        username={user.username || ""} 
        mode={viewMode}
      />
    </div>
  );
}