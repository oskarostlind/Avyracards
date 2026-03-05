"use client";

import Image from "next/image";
import type { User, Link as LinkModel } from "@prisma/client";
import { AdBanner } from "@/components/ads/google-adsense";
import { TrackedLink } from "@/components/analytics/trackers";
import { CustomThemeSettings, defaultSettings } from "@/types/theme";
import { getTheme } from "@/utils/theme";
import { SocialIcon } from "@/components/icons/social-icons";
import { Save } from "lucide-react";

type UserWithLinks = User & { links: LinkModel[] };

// Vi behöver föra in data från mappern här för att få actions (vCard)
import { MappedProfileData } from "@/lib/profile-mapper";

interface SocialProfileProps {
  user: UserWithLinks;
  data: MappedProfileData; // LÄGG TILL MAPPER-DATA
  showAds: boolean;
}

export function SocialProfile({ user, data, showAds }: SocialProfileProps) {
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

  const getLinkStyle = (isPrimary: boolean = false): React.CSSProperties => {
    if (!useCustomTheme) {
        if (isPrimary) return { backgroundColor: '#f8fafc', color: '#0f172a' };
        return {};
    }
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
    
    if (isPrimary) {
        base.backgroundColor = settings.textColor;
        base.color = accent === '#ffffff' ? '#0f172a' : accent;
    } else {
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
    }

    if (settings.buttonShadow && settings.buttonStyle !== 'brutal') {
        base.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    }
    return base;
  };

  const linkStyle = getLinkStyle();
  const primaryStyle = getLinkStyle(true);
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

          {/* Social Contact Actions */}
          {data.actions.length > 0 && (
             <div className="flex flex-wrap justify-center gap-3 mt-6">
                {data.actions.map(action => (
                    <a 
                      key={action.type}
                      href={action.url}
                      download={action.type === 'vcard' ? `${user.username}.vcf` : undefined}
                      className={action.type === 'vcard' ? `w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-transform hover:scale-[1.02] mb-2 ${!useCustomTheme ? 'bg-slate-100 text-slate-900' : ''}` : "p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all text-current border border-white/10"}
                      style={action.type === 'vcard' ? primaryStyle : (useCustomTheme ? { borderColor: settings.accentColor, color: settings.textColor } : {})}
                      title={action.label}
                    >
                       {action.type === 'vcard' ? <><Save size={16} /> {action.label}</> : <SocialIcon fallbackIcon={action.iconKey as any} size={20} />}
                    </a>
                ))}
             </div>
          )}

          <div className="mt-8 flex flex-col gap-4">
            {data.links.map((link) => (
              <TrackedLink
                key={link.id}
                linkId={link.id}
                ownerId={user.id}
                href={normalizeUrl(link.url)}
                className={`flex items-center justify-between px-5 py-4 text-sm font-medium transition-all hover:scale-[1.02] ${!useCustomTheme ? `${tokens.link} shadow-md rounded-xl` : ''}`}
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