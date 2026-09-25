"use client";

import type { User, Link } from "@prisma/client";
import { BusinessProfileForm } from "@/components/dashboard/business/business-profile-form";
import { LinksWorkspace } from "@/components/dashboard/links-workspace";
import { PublicProfileCard } from "@/components/dashboard/public-profile-card";
import type { LinkItem } from "@/components/links-list";
import type { DashboardTab } from "@/components/dashboard/dashboard-shell";

type BusinessViewProps = {
  user: User & { links: Link[] };
  tab: DashboardTab;
  onDirtyChange: (dirty: boolean) => void;
  onPreview: () => void;
};

/** Business-läget uppdelat på flikarna (alla monterade, inaktiva dolda). */
export function BusinessView({ user, tab, onDirtyChange, onPreview }: BusinessViewProps) {
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
    <>
      <div role="tabpanel" id="panel-links" aria-labelledby="tab-links" hidden={tab !== "links"}>
        <LinksWorkspace
          initialLinks={initialLinks}
          mode="BUSINESS"
          activeRedirectId={user.redirectLinkId}
          isPremium={user.isPremium}
          isAdmin={user.role === "ADMIN"}
        />
      </div>
      <div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" hidden={tab !== "profile"}>
        <BusinessProfileForm user={user} onDirtyChange={onDirtyChange} />
      </div>
      <div role="tabpanel" id="panel-share" aria-labelledby="tab-share" hidden={tab !== "share"}>
        <PublicProfileCard username={user.username!} onPreview={onPreview} />
      </div>
    </>
  );
}
