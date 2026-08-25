"use client";

import type { User, Link } from "@prisma/client";
import { SocialProfileForm } from "@/components/dashboard/social/social-profile-form"; 
import { PublicProfileCard } from "@/components/dashboard/public-profile-card";
import { CollapsibleSection } from "@/components/dashboard/accordion";
import { LinksWorkspace } from "@/components/dashboard/links-workspace";
import type { LinkItem } from "@/components/links-list";
import { useT } from "@/i18n/client";

type SocialViewProps = {
  user: User & { links: Link[] };
};

export function SocialView({ user }: SocialViewProps) {
  const t = useT();
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
    icon: link.icon,
    customColor: link.customColor,
  }));

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <CollapsibleSection
        title={t("dashboard.sections.profileInfo")}
        description={t("dashboard.sections.profileInfoDesc")}
        defaultOpen
      >
        <SocialProfileForm user={user} />
      </CollapsibleSection>

      <PublicProfileCard username={user.username!} />

      <CollapsibleSection
        title={t("dashboard.sections.linksSocial")}
        description={t("dashboard.sections.linksSocialDesc")}
        defaultOpen
      >
        <LinksWorkspace
        initialLinks={initialLinks}
        mode="SOCIAL"
        activeRedirectId={user.redirectLinkId} // <-- LÄGG TILL DENNA
        isPremium={user.isPremium}
        isAdmin={user.role === "ADMIN"}
        />
      </CollapsibleSection>
    </div>
  );
}