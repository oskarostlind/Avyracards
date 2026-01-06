"use client";

import type { User, Link } from "@prisma/client";
import { ProfileForm } from "@/components/dashboard/forms"; 
import { PublicProfileCard } from "@/components/dashboard/public-profile-card";
import { CollapsibleSection } from "@/components/dashboard/accordion";
import { LinksWorkspace } from "@/components/dashboard/links-workspace";
import type { LinkItem } from "@/components/links-list";

type SocialViewProps = {
  user: User & { links: Link[] };
};

export function SocialView({ user }: SocialViewProps) {
  // Filtrera ut länkar som är SOCIAL (eller saknar mode för gamla data)
  // TypeScript kommer sluta klaga på .mode när du kört prisma generate
  const socialLinks = user.links.filter(
    (l) => l.mode === "SOCIAL" || !l.mode
  );

  const initialLinks: LinkItem[] = socialLinks.map((link) => ({
    id: link.id,
    label: link.title || link.url,
    url: link.url,
    isVisible: link.isActive,
  }));

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <CollapsibleSection
        title="Profilinformation"
        description="Namnet, bio och profilbild som visas på din sociala profil."
        defaultOpen
      >
        <ProfileForm user={user} />
      </CollapsibleSection>

      <PublicProfileCard username={user.username!} />

      <CollapsibleSection
        title="Länkar (Social)"
        description="Lägg till och hantera knapparna på din AvyraCards-sida."
        defaultOpen
      >
        <LinksWorkspace 
        initialLinks={initialLinks} 
        mode="SOCIAL" 
        activeRedirectId={user.redirectLinkId} // <-- LÄGG TILL DENNA
        />
      </CollapsibleSection>
    </div>
  );
}