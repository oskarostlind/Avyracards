"use client";

import type { User, Link } from "@prisma/client";
import { BusinessProfileForm } from "@/components/dashboard/business-profile-form";
import { LinksWorkspace } from "@/components/dashboard/links-workspace";
import { CollapsibleSection } from "@/components/dashboard/accordion";
import { PublicProfileCard } from "@/components/dashboard/public-profile-card"; // NY IMPORT
import type { LinkItem } from "@/components/links-list";

type BusinessViewProps = {
  user: User & { links: Link[] };
};

export function BusinessView({ user }: BusinessViewProps) {
  const linkItems: LinkItem[] = user.links.map((link) => ({
    id: link.id,
    label: link.title || link.url,
    url: link.url,
    isVisible: link.isActive,
  }));

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Vänster: Business Profile Form */}
      <div className="flex-1 space-y-4">
        <CollapsibleSection
          title="Businessprofil"
          description="Visitkorts-läge med titel, företag, kontaktuppgifter och företagsinfo."
          defaultOpen
        >
          <BusinessProfileForm 
            user={user} 
            key={user.updatedAt?.toString() || "business-form"} 
            />
        </CollapsibleSection>
      </div>

      {/* Höger: Länkar & Publik Profil */}
      <aside className="w-full max-w-md space-y-4">
        
        {/* 1. Visa den publika länken även här! */}
        <PublicProfileCard username={user.username!} />

        {/* 2. Länkar */}
        <CollapsibleSection
          title="Länkar (Business)"
          description="Hantera vilka länkar som visas i din businessprofil."
          defaultOpen
        >
          <LinksWorkspace initialLinks={linkItems} />
        </CollapsibleSection>
      </aside>
    </div>
  );
}