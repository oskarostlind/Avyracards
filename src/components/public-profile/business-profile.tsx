"use client";

import Image from "next/image";
import type { User } from "@prisma/client";
import { AdBanner } from "@/components/ads/google-adsense";
import { TrackedLink } from "@/components/analytics/trackers";
import { CustomThemeSettings, defaultSettings } from "@/types/theme";
import { getTheme } from "@/utils/theme";
import { SocialIcon } from "@/components/icons/social-icons";
import { MappedProfileData } from "@/lib/profile-mapper";
import { ProfileSafetyActions } from "@/components/public-profile/profile-safety-actions";
import { Save } from "lucide-react";

interface BusinessProfileProps {
  data: MappedProfileData;
  user: User;
  showAds: boolean;
  /** Guideline 1.2: rapport-/blockeringskontroller på publika profiler. */
  viewerIsLoggedIn?: boolean;
  hasBlocked?: boolean;
}

const fontMap: Record<string, string> = {
  inter: "var(--font-inter), sans-serif",
  playfair: "'Playfair Display', serif",
  roboto: "'Roboto', sans-serif",
  lora: "'Lora', serif",
  space: "'Space Grotesk', sans-serif",
  oswald: "'Oswald', sans-serif",
};

export function BusinessProfile({ data, user, showAds, viewerIsLoggedIn = false, hasBlocked = false }: BusinessProfileProps) {
  const tokens = getTheme(user.theme); 
  const savedSettings = (user.businessThemeSettings as unknown as Partial<CustomThemeSettings>) || {};
  const settings: CustomThemeSettings = { ...defaultSettings, ...savedSettings };
  const showBranding = !user.isPremium || !settings.hideBranding;
  const hasCustomTheme = user.businessThemeSettings && Object.keys(user.businessThemeSettings).length > 0;

  const { image, displayName, headline, companyName, location, jobTitle, actions, links } = data;

  const currentFont = settings.font && fontMap[settings.font] ? fontMap[settings.font] : fontMap['inter'];

  const pageStyle: React.CSSProperties = hasCustomTheme ? {
    fontFamily: currentFont,
    color: settings.textColor,
    backgroundColor: settings.backgroundType === 'solid' ? settings.backgroundColor : '#000',
    backgroundImage: settings.backgroundType === 'image' ? `url(${settings.backgroundImage})` : 
                     settings.backgroundType === 'gradient' ? `linear-gradient(${settings.gradientDir}, ${settings.gradientFrom}, ${settings.gradientTo})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  } : {};

  const bgClass = !hasCustomTheme ? (tokens.bg || 'bg-nordic-primary') : '';
  const textClass = !hasCustomTheme ? (tokens.text || 'text-nordic-secondary') : '';

  const getButtonClass = () => {
    let base = "flex items-center justify-center gap-2 p-4 transition-all duration-300 font-bold text-sm group relative overflow-hidden ";
    if (settings.buttonStyle === "pill") base += "rounded-full ";
    else if (settings.buttonStyle === "rounded") base += "rounded-xl ";
    else if (settings.buttonStyle === "sharp") base += "rounded-none ";
    else if (settings.buttonStyle === "brutal") base += "rounded-sm shadow-[4px_4px_0px_0px_currentColor] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ";
    if (settings.buttonShadow && settings.buttonStyle !== "brutal") base += "shadow-lg hover:shadow-xl hover:-translate-y-0.5 ";
    return base;
  };

  const getButtonStyle = (isPrimary: boolean = false): React.CSSProperties => {
    if (!hasCustomTheme) {
        if (isPrimary) {
            return { backgroundColor: '#f8fafc', color: '#0f172a' }; 
        }
        return {};
    }
    
    const accent = settings.accentColor || "#fff";
    const text = settings.textColor || "#000";
    const style: React.CSSProperties = {};
    
    style.color = text; 

    if (isPrimary) {
        style.backgroundColor = text;
        style.color = accent === '#ffffff' ? '#0f172a' : accent;
    } else {
        if (settings.buttonStyle === "brutal") style.border = `2px solid ${text}`; 
        if (settings.buttonVariant === "outline") {
        style.border = `2px solid ${accent}`;
        style.color = accent;
        style.backgroundColor = "transparent";
        }
        else if (settings.buttonVariant === "soft") {
        style.backgroundColor = accent;
        style.opacity = 0.9;
        } 
        else if (settings.buttonVariant === "glass") {
        style.backgroundColor = "rgba(255,255,255,0.15)";
        style.backdropFilter = "blur(8px)";
        style.border = "1px solid rgba(255,255,255,0.2)";
        }
        else if (settings.buttonVariant === "ghost") {
        style.backgroundColor = "transparent";
        style.border = "1px solid transparent";
        style.color = settings.textColor;
        }
        else if (settings.buttonVariant === "shadow") {
        style.backgroundColor = accent;
        style.boxShadow = `0 10px 15px -3px ${accent}40`;
        }
        else {
        style.backgroundColor = accent;
        }
    }
    
    return style;
  };

  const getFrameClass = () => {
    if (!hasCustomTheme) return "rounded-2xl";
    if (settings.frameStyle === "circle") return "rounded-full";
    if (settings.frameStyle === "rounded") return "rounded-3xl";
    if (settings.frameStyle === "hexagon") return "hexagon-clip"; 
    if (settings.frameStyle === "none") return "rounded-none";
    if (settings.frameStyle === "ring") return "rounded-full ring-4 ring-offset-4 ring-offset-transparent";
    if (settings.frameStyle === "square") return "rounded-none";
    if (settings.frameStyle === "shadow") return "rounded-full";
    return "rounded-full";
  };

  const avatarStyle: React.CSSProperties = hasCustomTheme ? {
     boxShadow: settings.frameStyle === 'glow'
       ? `0 0 30px ${settings.accentColor}`
       : settings.frameStyle === 'shadow'
         ? `8px 8px 0 ${settings.accentColor}`
         : 'none',
     borderColor: (settings.frameStyle === 'ring' || settings.frameStyle === 'square') ? settings.accentColor : 'transparent',
  } : {};

  const cardStyle: React.CSSProperties = hasCustomTheme ? {
    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
    backdropFilter: 'blur(20px)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: '1px',
    color: settings.textColor,
    borderRadius: '1.5rem', 
  } : {};
  
  const cardClass = !hasCustomTheme ? `${tokens.card} backdrop-blur-md rounded-2xl` : '';

  const primaryAction = actions.find(a => a.type === 'vcard');
  const secondaryActions = actions.filter(a => a.type !== 'vcard');

  // --- NYTT: Spårning av vCard nedladdning ---
  const handleVcardClick = () => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const device = /mobile/i.test(ua) ? "Mobile" : /ipad|tablet/i.test(ua) ? "Tablet" : "Desktop";
    
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "CLICK",
        profileOwnerId: user.id,
        source: "vcard",
        device
      }),
    }).catch(() => {});
  };

  return (
    <main className={`min-h-screen font-sans ${bgClass} ${textClass}`} style={pageStyle}>
      
      {hasCustomTheme && settings.backgroundType === "image" && (
        <div 
            className="fixed inset-0 z-0 pointer-events-none" 
            style={{ 
                backgroundColor: `rgba(0,0,0, ${settings.backgroundOverlay ? settings.backgroundOverlay / 100 : 0})`, 
                backdropFilter: `blur(${settings.backgroundBlur || 0}px)` 
            }} 
        />
      )}

      {!hasCustomTheme && (
        <div className="relative h-48 w-full overflow-hidden bg-nordic-primary z-0">
            {user.backgroundUrl ? (
            <Image src={user.backgroundUrl} alt="Cover" fill className="object-cover opacity-60" />
            ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40" />
            )}
            <div className={`absolute inset-0 bg-gradient-to-t ${tokens.bg ? tokens.bg.replace('bg-', 'from-') : 'from-slate-950'} to-transparent`} />
        </div>
      )}

      <div className={`mx-auto max-w-2xl px-4 sm:px-6 relative pb-12 z-10 ${!hasCustomTheme ? '-mt-20' : 'pt-20'}`}>
        
        <div className={`shadow-2xl border overflow-hidden ${cardClass}`} style={cardStyle}>
          
          <div className="p-6 sm:p-8 border-b border-white/5">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div 
                    className={`relative h-24 w-24 overflow-hidden border-2 border-white/10 shadow-lg bg-gray-800 flex-shrink-0 ${getFrameClass()}`}
                    style={avatarStyle}
                >
                  {image ? (
                    <Image src={image} alt={displayName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-nordic-highlight">{displayName.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                
                <div className="space-y-1">
                   <h1 className="text-2xl sm:text-3xl font-bold">{displayName}</h1>
                   <div className={`flex flex-wrap gap-2 text-sm font-medium ${!hasCustomTheme ? tokens.textMuted : 'opacity-80'}`}>
                      {jobTitle && <span className="flex items-center gap-1"><SocialIcon fallbackIcon="job" size={14}/> {jobTitle}</span>}
                      {companyName && <span>@ {companyName}</span>}
                   </div>
                   {location && (
                      <div className="text-xs opacity-70 flex items-center gap-1 pt-1">
                          <SocialIcon fallbackIcon="location" size={12}/> {location}
                      </div>
                   )}
                </div>
            </div>
            {headline && (
               <p className={`mt-6 text-sm leading-relaxed border-l-4 border-white/20 pl-4 py-2 italic bg-white/5 rounded-r-lg ${!hasCustomTheme ? tokens.textMuted : 'opacity-80'}`}>{headline}</p>
            )}
          </div>

          {actions.length > 0 && (
             <div className="p-6 border-b border-white/5 space-y-3">
                {primaryAction && (
                    <a 
                        href={primaryAction.url}
                        download={primaryAction.type === 'vcard' ? `${user.username}.vcf` : undefined}
                        onClick={primaryAction.type === 'vcard' ? handleVcardClick : undefined}
                        className={`w-full ${getButtonClass()} ${!hasCustomTheme ? 'bg-slate-100 text-slate-900 rounded-xl' : ''}`}
                        style={getButtonStyle(true)}
                    >
                        {primaryAction.type === 'vcard' ? <Save size={18} className="mr-1" /> : <SocialIcon fallbackIcon={primaryAction.iconKey as any} size={16} />}
                        {primaryAction.label}
                    </a>
                )}
                
                {secondaryActions.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                        {secondaryActions.map(action => (
                            <a 
                                key={action.type}
                                href={action.url}
                                target={action.type === 'website' || action.type === 'booking' ? '_blank' : undefined}
                                className={`${action.type === 'website' ? 'col-span-2' : ''} ${getButtonClass()} ${!hasCustomTheme ? 'bg-slate-800 text-slate-300 rounded-xl border border-white/10' : ''}`}
                                style={getButtonStyle(false)}
                            >
                                <SocialIcon fallbackIcon={action.iconKey as any} size={16} /> {action.label}
                            </a>
                        ))}
                    </div>
                )}
             </div>
          )}

          {links.length > 0 && (
             <div className="p-6 bg-black/10">
                <h3 className="text-xs font-bold opacity-60 uppercase tracking-wider mb-4">Resurser & Länkar</h3>
                <div className="space-y-3">
                   {links.map((link) => (
                      <TrackedLink
                          key={link.id}
                          linkId={link.id}
                          ownerId={user.id}
                          href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                          className={`${getButtonClass()} ${!hasCustomTheme ? 'bg-slate-800 text-slate-300 rounded-xl border border-white/10 justify-start' : ''}`}
                          style={getButtonStyle(false)}
                      >
                          <div className={`absolute left-4 opacity-70 ${!hasCustomTheme ? 'relative left-0' : ''}`}>
                             <SocialIcon url={link.url || link.title || ""} size={20} />
                          </div>
                          <span className={`flex-1 text-center ${!hasCustomTheme ? 'text-left ml-3' : ''}`}>{link.title || link.url}</span>
                      </TrackedLink>
                   ))}
                </div>
             </div>
          )}

          {showAds && (
             <div className="p-4 border-t border-white/5 text-center bg-black/20">
                <p className="text-[10px] opacity-50 uppercase mb-2">Annons</p>
                <div className="mx-auto max-w-[300px] overflow-hidden rounded-lg"><AdBanner /></div>
             </div>
          )}
        </div>

        <ProfileSafetyActions
          username={user.username}
          isLoggedIn={viewerIsLoggedIn}
          initiallyBlocked={hasBlocked}
          color={settings.textColor}
        />

        {showBranding && (
           <div className="text-center mt-8">
              <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-xs font-bold shadow-lg hover:bg-white/20 transition border border-white/10" style={{ color: settings.textColor }}>
                 <span className="text-blue-400">⚡</span> Skapa ditt eget AvyraCards
              </a>
           </div>
        )}
      </div>
    </main>
  );
}