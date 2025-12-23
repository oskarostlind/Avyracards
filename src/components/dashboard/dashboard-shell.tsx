"use client";

import { useState, useTransition } from "react";
import type { User, Link } from "@prisma/client";
import { Eye, LayoutGrid, Briefcase } from "lucide-react";

import { SocialView } from "@/components/dashboard/social/social-view";
import { BusinessView } from "@/components/dashboard/business/business-view";
import { ProfilePreviewModal } from "@/components/dashboard/profile-preview-modal";

type DashboardShellProps = {
  user: User & { links: Link[] };
};

export function DashboardShell({ user }: DashboardShellProps) {
  const [profileMode, setProfileMode] = useState<"SOCIAL" | "BUSINESS">(
    (user.profileMode as "SOCIAL" | "BUSINESS") ?? "SOCIAL"
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleModeChange = (mode: "SOCIAL" | "BUSINESS") => {
    if (mode === profileMode) return;
    
    startTransition(async () => {
      setProfileMode(mode);
      try {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileMode: mode }),
        });
      } catch (error) {
        console.error("Failed to save profile mode", error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        
        {/* Vänster: Titel */}
        <div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Redigera Profil</h1>
          <p className="text-sm text-slate-400 mt-1">
            Hantera innehållet för din {profileMode === "SOCIAL" ? "privata" : "affärs"}profil.
          </p>
        </div>

        {/* Höger: Tabbar & Preview */}
        <div className="flex items-center gap-3">
            {/* Tydliga Tabs / Segmented Control */}
            <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-xl">
                <button
                    onClick={() => handleModeChange("SOCIAL")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        profileMode === "SOCIAL"
                        ? "bg-slate-800 text-white shadow-sm ring-1 ring-white/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                >
                    <LayoutGrid size={16} />
                    Social
                </button>
                <button
                    onClick={() => handleModeChange("BUSINESS")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        profileMode === "BUSINESS"
                        ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                >
                    <Briefcase size={16} />
                    Business
                </button>
            </div>

            {/* Preview Knapp */}
            <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
            >
                <Eye size={18} />
                <span className="hidden sm:inline">Preview</span>
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={`transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}>
        {profileMode === "BUSINESS" ? (
          <BusinessView user={user} />
        ) : (
          <SocialView user={user} />
        )}
      </div>

      {/* Preview Modal (Popup) */}
      <ProfilePreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        username={user.username || ""} 
      />
    </div>
  );
}