"use client";

import type { User, Link } from "@prisma/client";
import { BusinessProfileForm } from "@/components/dashboard/business/business-profile-form";
import { LinksWorkspace } from "@/components/dashboard/links-workspace";
import { CollapsibleSection } from "@/components/dashboard/accordion";
import { PublicProfileCard } from "@/components/dashboard/public-profile-card";
import type { LinkItem } from "@/components/links-list";
import { useT } from "@/i18n/client";

type BusinessViewProps = {
  user: User & { links: Link[] };
};

export function BusinessView({ user }: BusinessViewProps) {
  const t = useT();
  // Filtrera ut länkar som är BUSINESS
  const businessLinks = user.links.filter((l) => l.mode === "BUSINESS");

  const initialLinks: LinkItem[] = businessLinks.map((link) => ({
    id: link.id,
    label: link.title || link.url,
    url: link.url,
    isVisible: link.isActive,
    icon: link.icon,
    customColor: link.customColor,
  }));

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <div className="flex-1 space-y-4">
        <CollapsibleSection
          title={t("dashboard.sections.businessProfile")}
          description={t("dashboard.sections.businessProfileDesc")}
          defaultOpen
        >
          <BusinessProfileForm 
            user={user} 
            key={user.updatedAt?.toString() || "business-form"} 
          />
        </CollapsibleSection>
      </div>

      <aside className="w-full max-w-md space-y-4">
        <PublicProfileCard username={user.username!} />

        <CollapsibleSection
          title={t("dashboard.sections.linksBusiness")}
          description={t("dashboard.sections.linksBusinessDesc")}
          defaultOpen
        >
          <LinksWorkspace
          initialLinks={initialLinks}
          mode="BUSINESS"
          activeRedirectId={user.redirectLinkId} // <-- LÄGG TILL DENNA
          isPremium={user.isPremium}
          isAdmin={user.role === "ADMIN"}
           />
        </CollapsibleSection>
      </aside>
    </div>
  );
}