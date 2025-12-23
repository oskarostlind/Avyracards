"use client";

import type { User, Link } from "@prisma/client";
import { ProfileForm, LinksForm } from "@/components/dashboard/forms";
import { PublicProfileCard } from "@/components/dashboard/public-profile-card";
import { CollapsibleSection } from "@/components/dashboard/accordion";

type SocialViewProps = {
  user: User & { links: Link[] };
};

export function SocialView({ user }: SocialViewProps) {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Profilinfo */}
      <CollapsibleSection
        title="Profilinformation"
        description="Namnet, bio och profilbild som visas på din sociala profil."
        defaultOpen
      >
        <ProfileForm user={user} />
      </CollapsibleSection>

      {/* Publik länk (Den nya komponenten) */}
      <PublicProfileCard username={user.username!} />

      {/* Länkar */}
      <CollapsibleSection
        title="Länkar (Social)"
        description="Lägg till och hantera knapparna på din AvyraCards-sida."
        defaultOpen
      >
        {/* ÄNDRING: Tog bort publicUrl prop härifrån */}
        <LinksForm />
      </CollapsibleSection>
    </div>
  );
}