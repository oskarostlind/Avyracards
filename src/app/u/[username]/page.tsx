import { notFound, redirect } from "next/navigation";
import type { User, Link as LinkModel } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ProfileViewTracker } from "@/components/analytics/trackers";
import { SocialProfile } from "@/components/public-profile/social-profile";
import { BusinessProfile } from "@/components/public-profile/business-profile";

type PageProps = {
  params: { username: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

type UserWithLinks = User & { links: LinkModel[] };

export const runtime = "nodejs";
export const revalidate = 0;

export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  const username = params.username;
  
  const isPreview = searchParams.preview === 'true';
  const previewMode = typeof searchParams.mode === 'string' ? searchParams.mode : null;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      links: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Bestäm vilket läge som ska visas
  const displayMode = (isPreview && previewMode) 
    ? (previewMode === "BUSINESS" ? "BUSINESS" : "SOCIAL")
    : user.profileMode;

  // Filtrera länkar
  const filteredLinks = user.links.filter(link => {
    const linkMode = link.mode || "SOCIAL";
    return linkMode === displayMode;
  });

  const userForDisplay: UserWithLinks = {
    ...user,
    links: filteredLinks
  };

  console.log("DEBUG - Profile Mode:", user.profileMode);
  console.log("DEBUG - Business Settings:", JSON.stringify(user.businessThemeSettings, null, 2));

  // Redirect-logik (Endast om INTE preview)
  if (user.redirectEnabled && !isPreview) {
    let targetUrl: string | null = null;
    if (user.redirectLinkId) {
      const targetLink = user.links.find(l => l.id === user.redirectLinkId);
      if (targetLink) targetUrl = targetLink.url;
    } 
    else if (user.links.length > 0) {
      targetUrl = user.links[0].url;
    }
    
    if (targetUrl) {
      // Helper för redirect (behöver inte dupliceras i alla filer, men för enkelhetens skull här:)
      const normalizeUrl = (u: string) => /^(https?:|mailto:|tel:)/i.test(u.trim()) ? u.trim() : `https://${u.trim()}`;
      redirect(normalizeUrl(targetUrl));
    }
  }

  const showAds = !user.isPremium;
  const sourceParam = typeof searchParams.source === 'string' ? searchParams.source : undefined;

  return (
    <>
      <ProfileViewTracker userId={user.id} sourceParam={sourceParam} />
      {displayMode === "BUSINESS" ? (
        <BusinessProfile user={userForDisplay} showAds={showAds} />
      ) : (
        <SocialProfile user={userForDisplay} showAds={showAds} />
      )}
    </>
  );
}