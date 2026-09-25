"use client";

import type { User, Link } from "@prisma/client";
import { SocialProfileForm } from "@/components/dashboard/social/social-profile-form";
import { PublicProfileCard } from "@/components/dashboard/public-profile-card";
import { LinksWorkspace } from "@/components/dashboard/links-workspace";
import type { LinkItem } from "@/components/links-list";
import type { DashboardTab } from "@/components/dashboard/dashboard-shell";

type SocialViewProps = {
  user: User & { links: Link[] };
  tab: DashboardTab;
  onDirtyChange: (dirty: boolean) => void;
  onPreview: () => void;
};

/**
 * Social-läget uppdelat på flikarna. Alla tre hålls monterade (dolda med
 * `hidden`) så att osparad inmatning i Profil inte försvinner vid flikbyte.
 */
export function SocialView({ user, tab, onDirtyChange, onPreview }: SocialViewProps) {
  // SOCIAL, eller saknar mode (äldre data)
  const socialLinks = user.links.filter((l) => l.mode === "SOCIAL" || !l.mode);

  const initialLinks: LinkItem[] = socialLinks.map((link) => ({
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
          mode="SOCIAL"
          activeRedirectId={user.redirectLinkId}
          isPremium={user.isPremium}
          isAdmin={user.role === "ADMIN"}
        />
      </div>
      <div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" hidden={tab !== "profile"}>
        <SocialProfileForm user={user} onDirtyChange={onDirtyChange} />
      </div>
      <div role="tabpanel" id="panel-share" aria-labelledby="tab-share" hidden={tab !== "share"}>
        <PublicProfileCard username={user.username!} onPreview={onPreview} />
      </div>
    </>
  );
}
