"use client";

import Image from "next/image";
import type { User, Link as LinkModel } from "@prisma/client";
import { AdBanner } from "@/components/ads/google-adsense";
import { TrackedLink } from "@/components/analytics/trackers";
import { CustomThemeSettings, defaultSettings } from "@/types/theme";
import { getTheme } from "@/utils/theme";
import { SocialIcon } from "@/components/icons/social-icons";

type UserWithLinks = User & { links: LinkModel[] };

interface SocialProfileProps {
  user: UserWithLinks;
  showAds: boolean;
}

export function SocialProfile({ user, showAds }: SocialProfileProps) {
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

          {/* NYTT: Kontaktknappar för Social Profil */}
          {(user.phoneNumber || user.contactEmail) && (
             <div className="flex justify-center gap-3 mt-6">
                {user.phoneNumber && (
                   <a 
                     href={`tel:${user.phoneNumber}`} 
                     className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all text-current border border-white/10"
                     title="Ring"
                   >
                      <SocialIcon fallbackIcon="phone" size={20} />
                   </a>
                )}
                {user.contactEmail && (
                   <a 
                     href={`mailto:${user.contactEmail}`} 
                     className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all text-current border border-white/10"
                     title="Maila"
                   >
                      <SocialIcon fallbackIcon="email" size={20} />
                   </a>
                )}
             </div>
          )}

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

function normalizeUrl(url: string): string {
  if (!url) return "/";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^mailto:/i.test(trimmed)) return trimmed;
  if (/^tel:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}