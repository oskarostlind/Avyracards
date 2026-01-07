import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import type { User, Link as LinkModel } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getTheme } from "@/utils/theme";
import { AdBanner } from "@/components/ads/google-adsense";
import { ProfileViewTracker, TrackedLink } from "@/components/analytics/trackers";
import { CustomThemeSettings, defaultSettings } from "@/types/theme";
import { SocialIcon } from "@/components/icons/social-icons"; // <-- NY IMPORT

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

  const displayMode = (isPreview && previewMode) 
    ? (previewMode === "BUSINESS" ? "BUSINESS" : "SOCIAL")
    : user.profileMode;

  const filteredLinks = user.links.filter(link => {
    const linkMode = link.mode || "SOCIAL";
    return linkMode === displayMode;
  });

  const userForDisplay: UserWithLinks = {
    ...user,
    links: filteredLinks
  };

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

// --------------------------------------------------------------------------------------
// SOCIAL PROFILE
// --------------------------------------------------------------------------------------

function SocialProfile({ user, showAds }: { user: UserWithLinks; showAds: boolean }) {
  const useCustomTheme = !!user.themeSettings;
  const savedSettings = (user.themeSettings as unknown as Partial<CustomThemeSettings>) || {};
  const settings: CustomThemeSettings = { ...defaultSettings, ...savedSettings };
  
  const tokens = getTheme(user.theme);
  const displayName = user.name || user.username;
  const bio = user.bio;
  const showBranding = !user.isPremium || !settings.hideBranding;

  const pageStyle: React.CSSProperties = useCustomTheme ? {
    fontFamily: settings.font,
    color: settings.textColor,
    backgroundColor: settings.backgroundType === 'solid' ? settings.backgroundColor : '#000',
    backgroundImage: settings.backgroundType === 'image' ? `url(${settings.backgroundImage})` : 
                     settings.backgroundType === 'gradient' ? `linear-gradient(${settings.gradientDir}, ${settings.gradientFrom}, ${settings.gradientTo})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  } : {};

  const cardStyle: React.CSSProperties = useCustomTheme ? {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(16px)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: '1px',
    color: settings.textColor,
  } : {};

  const getLinkStyle = (): React.CSSProperties => {
    if (!useCustomTheme) return {};
    const base: React.CSSProperties = { color: settings.textColor };
    
    if (settings.buttonStyle === 'pill') base.borderRadius = '9999px';
    else if (settings.buttonStyle === 'rounded') base.borderRadius = '0.75rem';
    else if (settings.buttonStyle === 'sharp') base.borderRadius = '0px';
    else if (settings.buttonStyle === 'brutal') {
        base.borderRadius = '0.25rem';
        base.border = `2px solid ${settings.textColor}`;
        base.boxShadow = `4px 4px 0px 0px ${settings.textColor}`;
    }

    const accent = settings.accentColor || '#fff';
    if (settings.buttonVariant === 'solid') base.backgroundColor = accent;
    else if (settings.buttonVariant === 'outline') {
        base.border = `2px solid ${accent}`;
        base.color = accent;
        base.backgroundColor = 'transparent';
    } else if (settings.buttonVariant === 'soft') {
        base.backgroundColor = accent;
        base.opacity = 0.9;
    } else if (settings.buttonVariant === 'glass') {
        base.backgroundColor = 'rgba(255,255,255,0.15)';
        base.backdropFilter = 'blur(10px)';
        base.border = '1px solid rgba(255,255,255,0.2)';
    } else if (settings.buttonVariant === 'shadow') {
        base.backgroundColor = accent;
        base.boxShadow = `0 10px 15px -3px ${accent}40`;
    }

    if (settings.buttonShadow && settings.buttonStyle !== 'brutal') {
        base.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    }
    return base;
  };

  const linkStyle = getLinkStyle();
  const frameStyle = settings.frameStyle || 'circle';
  const accentColor = settings.accentColor || '#ffffff';
  
  let borderRadius = '50%'; 
  if (frameStyle === 'rounded') borderRadius = '20%';
  if (frameStyle === 'none') borderRadius = '0';
  if (frameStyle === 'hexagon') borderRadius = '0'; 

  const avatarStyle: React.CSSProperties = useCustomTheme ? {
    borderColor: frameStyle === 'ring' ? accentColor : 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius,
    boxShadow: frameStyle === 'glow' ? `0 0 30px ${accentColor}` : 'none',
  } : {};

  return (
    <main className={`min-h-screen ${!useCustomTheme ? (tokens.bg || 'bg-nordic-primary') : ''} ${!useCustomTheme ? (tokens.text || 'text-nordic-secondary') : ''}`} style={pageStyle}>
      {useCustomTheme && settings.backgroundType === "image" && (
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundColor: `rgba(0,0,0, ${settings.backgroundOverlay ? settings.backgroundOverlay / 100 : 0})`, backdropFilter: `blur(${settings.backgroundBlur || 0}px)` }} />
      )}

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center px-4 py-12">
        <section className={`w-full rounded-[32px] border p-8 shadow-2xl ${!useCustomTheme ? `${tokens.card} backdrop-blur-md` : ''}`} style={cardStyle}>
          <div className="flex flex-col items-center gap-5">
            <div className={`relative h-28 w-28 overflow-hidden border-4 shadow-xl`} style={useCustomTheme ? avatarStyle : { borderRadius: '50%', borderColor: 'rgba(255,255,255,0.1)' }}>
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={displayName} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-800 text-4xl font-bold">{displayName.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
              {bio && (
                <p className={`text-sm leading-relaxed max-w-[280px] mx-auto ${!useCustomTheme ? tokens.textMuted : ''}`} style={{ opacity: 0.9, whiteSpace: 'pre-line' }}>{bio}</p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            {user.links.map((link) => (
              <TrackedLink
                key={link.id}
                linkId={link.id}
                ownerId={user.id}
                href={normalizeUrl(link.url)}
                className={`flex items-center justify-between px-5 py-4 text-sm font-medium transition-all hover:scale-[1.02] ${!useCustomTheme ? `${tokens.link} shadow-md` : ''}`}
                style={linkStyle}
              >
                <span className="flex items-center gap-3">
                  {/* HÄR BYTTE VI UT getSocialIcon MOT SocialIcon */}
                  <span className="text-lg opacity-80"><SocialIcon url={link.url || link.title} size={20} /></span>
                  <span className="font-semibold">{link.title || link.url}</span>
                </span>
              </TrackedLink>
            ))}
          </div>
          {showAds && <AdBanner />}
        </section>

        {showBranding && (
          <div className="mt-8 text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity" style={{ color: useCustomTheme ? settings.textColor : undefined }}>
            Powered by AvyraCards
          </div>
        )}
      </div>
    </main>
  );
}

// --------------------------------------------------------------------------------------
// BUSINESS PROFILE
// --------------------------------------------------------------------------------------

function BusinessProfile({ user, showAds }: { user: UserWithLinks; showAds: boolean }) {
  const tokens = getTheme(user.theme); 
  const savedSettings = (user.themeSettings as unknown as Partial<CustomThemeSettings>) || {};
  const settings: CustomThemeSettings = { ...defaultSettings, ...savedSettings };
  const showBranding = !user.isPremium || !settings.hideBranding;

  const displayName = user.name || user.username;
  const headline = user.businessHeadline || user.jobTitle || "Business Profile";
  const company = user.companyName;

  return (
    <main className={`min-h-screen font-sans ${tokens.bg} ${tokens.text}`}>
      <div className="relative h-48 w-full overflow-hidden bg-nordic-primary">
        {user.backgroundUrl ? (
           <Image src={user.backgroundUrl} alt="Cover" fill className="object-cover opacity-60" />
        ) : (
           <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${tokens.bg ? tokens.bg.replace('bg-', 'from-') : 'from-slate-950'} to-transparent`} />
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 -mt-20 relative pb-12">
        <div className={`rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-md ${tokens.card}`}>
          <div className="p-6 sm:p-8 border-b border-white/5">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-4 border-white/10 shadow-lg bg-gray-800 flex-shrink-0">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={displayName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-nordic-highlight">{displayName.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                
                <div className="space-y-1">
                   <h1 className="text-2xl sm:text-3xl font-bold">{displayName}</h1>
                   <div className={`flex flex-wrap gap-2 text-sm font-medium ${tokens.textMuted}`}>
                      {user.jobTitle && <span className="flex items-center gap-1"><SocialIcon fallbackIcon="job" size={14}/> {user.jobTitle}</span>}
                      {company && <span>@ {company}</span>}
                   </div>
                   {user.location && (
                      <div className="text-xs text-nordic-highlight flex items-center gap-1 pt-1">
                          <SocialIcon fallbackIcon="location" size={12}/> {user.location}
                      </div>
                   )}
                </div>
            </div>
            {headline && (
               <p className={`mt-6 text-sm leading-relaxed border-l-4 border-blue-500/50 pl-4 py-2 italic bg-white/5 rounded-r-lg ${tokens.textMuted}`}>&quot;{headline}&quot;</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/5 border-b border-white/5">
             {user.businessPhone && (
                <a href={`tel:${user.businessPhone}`} className={`p-4 flex items-center justify-center gap-2 transition font-medium text-sm hover:bg-white/5 ${tokens.text}`}>
                   <SocialIcon fallbackIcon="phone" size={16} className="text-blue-400"/> Ring
                </a>
             )}
             {user.businessEmail && (
                <a href={`mailto:${user.businessEmail}`} className={`p-4 flex items-center justify-center gap-2 transition font-medium text-sm hover:bg-white/5 ${tokens.text}`}>
                   <SocialIcon fallbackIcon="email" size={16} className="text-blue-400"/> Maila
                </a>
             )}
             {user.companyWebsite && (
                <a href={normalizeUrl(user.companyWebsite)} target="_blank" className={`p-4 flex items-center justify-center gap-2 transition font-medium text-sm col-span-2 border-t border-white/5 hover:bg-white/5 ${tokens.text}`}>
                   <SocialIcon fallbackIcon="website" size={16} className="text-blue-400"/> Besök hemsida
                </a>
             )}
          </div>

          {user.links.length > 0 && (
             <div className="p-6 bg-nordic-primary/20">
                <h3 className="text-xs font-bold text-nordic-highlight uppercase tracking-wider mb-4">Resurser & Länkar</h3>
                <div className="space-y-3">
                   {user.links.map((link) => (
                      <TrackedLink
                         key={link.id}
                         linkId={link.id}
                         ownerId={user.id}
                         href={normalizeUrl(link.url)}
                         className={`flex items-center justify-between p-4 rounded-xl border border-white/5 shadow-sm transition-all group hover:border-white/20 hover:bg-white/5 ${tokens.card}`}
                      >
                          <div className="flex items-center gap-3">
                             <span className="text-xl group-hover:scale-110 transition-transform">
                               {/* HÄR BYTTE VI UT getBusinessIcon */}
                               <SocialIcon url={link.url || link.title} size={20} />
                             </span>
                             <span className={`font-medium ${tokens.text}`}>{link.title || link.url}</span>
                          </div>
                          <span className="text-nordic-highlight group-hover:text-nordic-secondary">→</span>
                      </TrackedLink>
                   ))}
                </div>
             </div>
          )}

          {showAds && (
             <div className="p-4 border-t border-white/5 text-center bg-nordic-primary/20">
                <p className="text-[10px] text-gray-600 uppercase mb-2">Annons</p>
                <div className="mx-auto max-w-[300px] overflow-hidden rounded-lg"><AdBanner /></div>
             </div>
          )}
        </div>

        {showBranding && (
           <div className="text-center mt-8">
              <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-nordic-secondary text-xs font-bold shadow-lg hover:bg-white/20 transition border border-white/10">
                 <span className="text-blue-400">⚡</span> Skapa ditt eget AvyraCards
              </a>
           </div>
        )}
      </div>
    </main>
  );
}

function normalizeUrl(url: string): string {
  if (!url) return "/";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^mailto:/i.test(trimmed)) return trimmed;
  if (/^tel:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}