import { resolveRedirectUrl } from "@/lib/profile-redirect";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasBlocked as viewerHasBlocked } from "@/lib/moderation";
import { BlockedProfileNotice } from "@/components/public-profile/blocked-profile-notice";
import { ProfileViewTracker } from "@/components/analytics/trackers";
import { SocialProfile } from "@/components/public-profile/social-profile";
import { BusinessProfile } from "@/components/public-profile/business-profile";
import { getProfileData } from "@/lib/profile-mapper"; 
import { ThemeMode } from "@/types/theme";
import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { SITE_URL } from "@/lib/seo";

type PageProps = {
  params: { username: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export const runtime = "nodejs";
export const revalidate = 0;

/**
 * Metadata per profil: namn i titeln, rubrik/bio som beskrivning, avatar som
 * delningsbild och canonical utan preview-parametrar.
 *
 * Indexeringsregel: en profil indexeras bara om ägaren faktiskt fyllt i något
 * (bio/rubrik eller minst en aktiv länk). Tomma profiler, avstängda konton
 * och förhandsvisningar får noindex — en ny domän ska inte spädas ut med
 * tusentals nästan tomma sidor. Profilerna listas inte heller i sitemap.xml.
 */
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const username = params.username;
  const canonical = `${SITE_URL}/u/${encodeURIComponent(username)}`;
  const isPreview = searchParams.preview === "true";

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
      businessAvatarUrl: true,
      profileMode: true,
      isSuspended: true,
      hideFromSearch: true,
      jobTitle: true,
      companyName: true,
      businessHeadline: true,
      _count: { select: { links: { where: { isActive: true } } } },
    },
  });

  if (!user || user.isSuspended) {
    return { title: "AvyraCards", robots: { index: false, follow: false } };
  }

  const t = getT();
  const displayName = user.name?.trim() || user.username;
  const isBusiness = user.profileMode === "BUSINESS";

  const headline = isBusiness
    ? [user.businessHeadline || user.jobTitle, user.companyName].filter(Boolean).join(" · ")
    : user.bio?.trim();

  const description =
    (headline && headline.trim()) || t("seo.profile.descriptionFallback", { name: displayName });

  const image = (isBusiness ? user.businessAvatarUrl || user.avatarUrl : user.avatarUrl) || "/avyra_transparent_v2.jpg";

  // "Dölj från Google" i Inställningar → Konto: ägaren har valt noindex.
  // (Inställningen sparades tidigare men användes aldrig i renderingen.)
  const hasContent = Boolean(headline && headline.trim()) || user._count.links > 0;
  const indexable = hasContent && !isPreview && !user.hideFromSearch;

  const title = `${displayName} – ${t("seo.profile.titleSuffix")}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonical,
      images: [{ url: image, alt: displayName }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image],
    },
  };
}

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
      isSuspended: true,
      
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
            customColor: true,
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

  // Guideline 1.2: moderationen måste kunna ta bort stötande innehåll. En
  // avstängd profil ska inte gå att nå publikt — men kontot finns kvar så att
  // ägaren kan höra av sig och överklaga.
  if (user.isSuspended) {
    notFound();
  }

  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  // En blockerad profil ska inte längre visas för den som blockerat den,
  // och besöket ska inte heller loggas i profilens statistik.
  if (viewerId && viewerId !== user.id) {
    const blocked = await viewerHasBlocked(viewerId, user.id);
    if (blocked) {
      return <BlockedProfileNotice username={user.username} />;
    }
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

  // Direktlänk: bara när användaren själv valt en länk (se resolveRedirectUrl).
  if (!isPreview) {
    const targetUrl = resolveRedirectUrl(user, filteredLinks);
    if (targetUrl) {
      const normalizeUrl = (u: string) => /^(https?:|mailto:|tel:)/i.test(u.trim()) ? u.trim() : `https://${u.trim()}`;
      redirect(normalizeUrl(targetUrl));
    }
  }

  const sourceParam = typeof searchParams.source === 'string' ? searchParams.source : undefined;

  return (
    <>
      <ProfileViewTracker userId={user.id} sourceParam={sourceParam} />
      {displayMode === "BUSINESS" ? (
        <BusinessProfile 
            data={profileData} 
            user={userForDisplay as any} // Vi skickar det "rena" objektet
            viewerIsLoggedIn={Boolean(viewerId)} 
        />
      ) : (
        <SocialProfile 
            // Om SocialProfile inte är uppdaterad att ta emot 'data' än, 
            // så funkar detta ändå för länkarna eftersom userForDisplay är städad.
            // @ts-ignore
            data={profileData}
            user={userForDisplay as any} 
            viewerIsLoggedIn={Boolean(viewerId)} 
        />
      )}
    </>
  );
}