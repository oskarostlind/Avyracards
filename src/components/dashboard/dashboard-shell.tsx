"use client";

import { useState, useTransition } from "react";
import type { User, Link } from "@prisma/client";
import { 
  LayoutGrid, 
  Briefcase, 
  Eye, 
  CheckCircle2, 
  Power 
} from "lucide-react";

import { SocialView } from "@/components/dashboard/social/social-view";
import { BusinessView } from "@/components/dashboard/business/business-view";
import { ProfilePreviewModal } from "@/components/dashboard/profile-preview-modal";

type DashboardShellProps = {
  user: User & { links: Link[] };
};

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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
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
            
            {/* --- TABBAR FÖR ATT BYTA VY --- */}
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
        // NYTT: Skickar med vilket läge vi vill förhandsgranska
        mode={viewMode}
      />
    </div>
  );
}