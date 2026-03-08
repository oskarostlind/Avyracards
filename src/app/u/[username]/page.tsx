import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileViewTracker } from "@/components/analytics/trackers";
import { SocialProfile } from "@/components/public-profile/social-profile";
import { BusinessProfile } from "@/components/public-profile/business-profile";
import { getProfileData } from "@/lib/profile-mapper"; 
import { ThemeMode } from "@/types/theme";

type PageProps = {
  params: { username: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export const runtime = "nodejs";
export const revalidate = 0;

export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  const username = params.username;
  
  const isPreview = searchParams.preview === 'true';
  const previewMode = typeof searchParams.mode === 'string' ? searchParams.mode : null;

  // Vi använder select för att få med nya fält (businessAvatarUrl) och mode
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
      businessAvatarUrl: true, // <--- Det nya fältet
      isPremium: true,
      profileMode: true,
      theme: true,
      themeSettings: true,
      businessThemeSettings: true,
      redirectEnabled: true,
      redirectLinkId: true,
      
      // Business-fält
      jobTitle: true,
      companyName: true,
      location: true,
      businessHeadline: true,
      businessEmail: true,
      businessPhone: true,
      companyWebsite: true,
      bookingUrl: true,

      // Social-fält
      contactEmail: true,
      phoneNumber: true,

      // Vi hämtar ALLA länkar här, precis som du gjorde förut
      links: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
            id: true,
            title: true,
            url: true,
            icon: true,
            mode: true, 
            isActive: true,
            order: true
        }
      },
    },
  });

  if (!user) {
    notFound();
  }

  const displayMode: ThemeMode = (isPreview && previewMode) 
    ? (previewMode === "BUSINESS" ? "BUSINESS" : "SOCIAL")
    : (user.profileMode as ThemeMode);

  // 1. ANVÄND DIN LOGIK FÖR ATT FILTRERA LÄNKAR
  // Detta garanterar att userForDisplay ALDRIG innehåller fel länkar
  const filteredLinks = user.links.filter(link => {
    // Om mode är null/undefined, räkna det som SOCIAL (precis som din deployade kod)
    const linkMode = link.mode || "SOCIAL";
    return linkMode === displayMode;
  });

  // 2. SKAPA ETT "RENT" USER OBJEKT
  // Vi skriver över links med den filtrerade listan
  const userForDisplay = {
    ...user,
    links: filteredLinks 
  };

  // 3. KÖR MAPPERN (För att fixa bild, rubriker och kontaktknappar)
  // Vi skickar in userForDisplay så mappern också ser rätt länkar
  // @ts-ignore
  const profileData = getProfileData(userForDisplay, displayMode);

  // Redirect logic (Använd den filtrerade listan)
  if (user.redirectEnabled && !isPreview) {
    let targetUrl: string | null = null;
    if (user.redirectLinkId) {
      const targetLink = filteredLinks.find((l: any) => l.id === user.redirectLinkId);
      if (targetLink) targetUrl = targetLink.url;
    } 
    else if (filteredLinks.length > 0) {
      targetUrl = filteredLinks[0].url;
    }
    
    if (targetUrl) {
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
        <BusinessProfile 
            data={profileData} 
            user={userForDisplay as any} // Vi skickar det "rena" objektet
            showAds={showAds} 
        />
      ) : (
        <SocialProfile 
            // Om SocialProfile inte är uppdaterad att ta emot 'data' än, 
            // så funkar detta ändå för länkarna eftersom userForDisplay är städad.
            // @ts-ignore
            data={profileData}
            user={userForDisplay as any} 
            showAds={showAds} 
        />
      )}
    </>
  );
}