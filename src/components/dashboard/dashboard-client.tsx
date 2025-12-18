"use client";

import { useState, useTransition } from "react";
import type { User, Link } from "@prisma/client";

// Importera formulären vi nyss uppdaterade
import { ProfileForm, LinksForm } from "@/components/dashboard/forms";
import { BusinessProfileForm } from "@/components/dashboard/business-profile-form";
import { LinksWorkspace } from "@/components/dashboard/links-workspace";
import type { LinkItem } from "@/components/links-list";
import { CollapsibleSection } from "@/components/dashboard/accordion";

type DashboardClientProps = {
  user: User & { links: Link[] };
};

export function DashboardClient({ user }: DashboardClientProps) {
  const [profileMode, setProfileMode] = useState<"SOCIAL" | "BUSINESS">(
    (user.profileMode as "SOCIAL" | "BUSINESS") ?? "SOCIAL"
  );
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  // Mappa Prisma-länkar → LinkItem för LinksWorkspace (Business-läge)
  const linkItems: LinkItem[] = user.links.map((link) => ({
    id: link.id,
    label: link.title || link.url,
    url: link.url,
    isVisible: link.isActive,
  }));

  const handleModeChange = (mode: "SOCIAL" | "BUSINESS") => {
    if (mode === profileMode) return;

    setProfileMode(mode);
    setStatus(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileMode: mode }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setStatus(
            data?.error ?? "Kunde inte spara profil-läget. Försök igen."
          );
        } else {
          setStatus("Profil-läget är uppdaterat.");
        }
      } catch (error) {
        console.error(error);
        setStatus("Något gick fel vid uppdatering av profil-läget.");
      }
    });
  };

  const isBusiness = profileMode === "BUSINESS";

  return (
    <div className="flex flex-col gap-6">
      {/* Top-card med toggle */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 shadow-xl shadow-black/30">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-lg font-semibold text-slate-50">
              Din AvyraCards-panel
            </h1>
            <p className="text-xs text-slate-400">
              Uppdatera din profil och hantera dina länkar. Välj om du jobbar i
              socialt läge eller business-läge.
            </p>
          </div>

          <div className="inline-flex rounded-full border border-slate-700 bg-slate-900/80 p-1 text-xs">
            <button
              type="button"
              onClick={() => handleModeChange("SOCIAL")}
              className={`rounded-full px-3 py-1.5 font-medium transition ${
                profileMode === "SOCIAL"
                  ? "bg-slate-800 text-slate-50 shadow-sm shadow-slate-900/60"
                  : "text-slate-300 hover:bg-slate-800/70"
              }`}
            >
              Social profil
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("BUSINESS")}
              className={`rounded-full px-3 py-1.5 font-medium transition ${
                profileMode === "BUSINESS"
                  ? "bg-slate-800 text-slate-50 shadow-sm shadow-slate-900/60"
                  : "text-slate-300 hover:bg-slate-800/70"
              }`}
            >
              Business profil
            </button>
          </div>
        </div>

        {status && (
          <p className="mt-2 text-xs text-slate-400">
            {isPending ? "Sparar..." : status}
          </p>
        )}
      </section>

      {/* Innehåll: Social vs Business */}
      {isBusiness ? (
        /* ========== BUSINESS-LÄGE ========== */
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Vänster: business-formen i accordions */}
          <div className="flex-1 space-y-4">
            <CollapsibleSection
              title="Businessprofil"
              description="Visitkorts-läge med titel, företag, kontaktuppgifter och företagsinfo."
              defaultOpen
            >
              <BusinessProfileForm user={user} />
            </CollapsibleSection>
          </div>

          {/* Höger: länkar, med LinksWorkspace */}
          <aside className="w-full max-w-md space-y-4">
            <CollapsibleSection
              title="Länkar (Business)"
              description="Hantera vilka länkar som visas i din businessprofil – t.ex. LinkedIn, företagssida, CV."
              defaultOpen
            >
              <LinksWorkspace initialLinks={linkItems} />
              
            </CollapsibleSection>
          </aside>
        </div>
      ) : (
        /* ========== SOCIAL-LÄGE ========== */
        <div className="flex flex-col gap-4">
          <CollapsibleSection
            title="Profilinformation"
            description="Namnet, bio och profilbild som visas på din sociala profil."
            defaultOpen
          >
            <ProfileForm user={user} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Länkar (Social)"
            description="Lägg till och hantera knapparna på din AvyraCards-sida."
            defaultOpen
          >
            <LinksForm publicUrl={`/u/${user.username}`} />
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}