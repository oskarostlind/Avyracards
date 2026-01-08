"use client";

import Image from "next/image";
import type { User, Link as LinkModel } from "@prisma/client";
import { AdBanner } from "@/components/ads/google-adsense";
import { TrackedLink } from "@/components/analytics/trackers";
import { CustomThemeSettings, defaultSettings } from "@/types/theme";
import { getTheme } from "@/utils/theme";
import { SocialIcon } from "@/components/icons/social-icons";
import React, { useEffect } from "react";

type UserWithLinks = User & { links: LinkModel[] };

interface BusinessProfileProps {
  user: UserWithLinks;
  showAds: boolean;
}

// Mappning för att typsnitten ska fungera "på riktigt" i CSS
const fontMap: Record<string, string> = {
  inter: "var(--font-inter), sans-serif",
  playfair: "'Playfair Display', serif",
  roboto: "'Roboto', sans-serif",
  lora: "'Lora', serif",
  space: "'Space Grotesk', sans-serif",
  oswald: "'Oswald', sans-serif",
};

export function BusinessProfile({ user, showAds }: BusinessProfileProps) {
  const tokens = getTheme(user.theme); 
  
  const savedSettings = (user.businessThemeSettings as unknown as Partial<CustomThemeSettings>) || {};
  const settings: CustomThemeSettings = { ...defaultSettings, ...savedSettings };
  
  const showBranding = !user.isPremium || !settings.hideBranding;
  const displayName = user.name || user.username;
  const headline = user.businessHeadline || user.jobTitle || "Business Profile";
  const company = user.companyName;

  const hasCustomTheme = user.businessThemeSettings && Object.keys(user.businessThemeSettings).length > 0;

  // --- 1. FONTER & BAKGRUND ---
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

  // --- 2. KNAPP-LOGIK (Kopierad från Preview för att matcha exakt) ---
  const getButtonClass = () => {
    let base = "flex items-center justify-center gap-2 p-4 transition-all duration-300 font-bold text-sm group relative overflow-hidden ";
    
    // Form
    if (settings.buttonStyle === "pill") base += "rounded-full ";
    else if (settings.buttonStyle === "rounded") base += "rounded-xl ";
    else if (settings.buttonStyle === "sharp") base += "rounded-none ";
    else if (settings.buttonStyle === "brutal") base += "rounded-sm shadow-[4px_4px_0px_0px_currentColor] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ";
    
    // Skugga
    if (settings.buttonShadow && settings.buttonStyle !== "brutal") base += "shadow-lg hover:shadow-xl hover:-translate-y-0.5 ";

    return base;
  };

  const getButtonStyle = (): React.CSSProperties => {
    if (!hasCustomTheme) return {};

    const accent = settings.accentColor || "#fff";
    const text = settings.textColor || "#000";
    const style: React.CSSProperties = {};

    style.color = text; // Default text color in buttons

    if (settings.buttonStyle === "brutal") {
        style.border = `2px solid ${text}`; 
    }

    if (settings.buttonVariant === "outline") {
      style.border = `2px solid ${accent}`;
      style.color = accent;
      style.backgroundColor = "transparent";
    }
    else if (settings.buttonVariant === "soft") {
      style.backgroundColor = accent;
      style.opacity = 0.9;
      // Soft buttons usually look better with contrasting text, usually dark or white depending on accent.
      // For simplicity here we keep user choice or maybe force black/white if we calculated contrast.
      // Often soft buttons imply the accent color is the bg.
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
      // Solid (Default)
      style.backgroundColor = accent;
      // Note: If background is accent, text should probably be readable against it. 
      // Assuming user sets textColor appropriately or we accept current behavior.
    }
    
    return style;
  };

  // --- 3. AVATAR RAM (Glow/Ring) ---
  const getFrameClass = () => {
    if (!hasCustomTheme) return "rounded-2xl";
    if (settings.frameStyle === "circle") return "rounded-full";
    if (settings.frameStyle === "rounded") return "rounded-3xl";
    if (settings.frameStyle === "hexagon") return "hexagon-clip"; 
    if (settings.frameStyle === "none") return "rounded-none";
    if (settings.frameStyle === "ring") return "rounded-full ring-4 ring-offset-4 ring-offset-transparent";
    return "rounded-full"; 
  };

  const avatarStyle: React.CSSProperties = hasCustomTheme ? {
     boxShadow: settings.frameStyle === 'glow' ? `0 0 30px ${settings.accentColor}` : 'none',
     borderColor: settings.frameStyle === 'ring' ? settings.accentColor : 'transparent',
  } : {};


  // --- 4. KORT STIL ---
  const cardStyle: React.CSSProperties = hasCustomTheme ? {
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Lite mer transparent än förut
    backdropFilter: 'blur(20px)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: '1px',
    color: settings.textColor,
    borderRadius: '1.5rem', // Matchar oftast bättre med moderna teman
  } : {};
  
  const cardClass = !hasCustomTheme ? `${tokens.card} backdrop-blur-md rounded-2xl` : '';

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

      {/* Fallback Header för icke-teman */}
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
          
          {/* --- HEADER --- */}
          <div className="p-6 sm:p-8 border-b border-white/5">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {/* AVATAR MED NYA STILAR */}
                <div 
                    className={`relative h-24 w-24 overflow-hidden border-2 border-white/10 shadow-lg bg-gray-800 flex-shrink-0 ${getFrameClass()}`}
                    style={avatarStyle}
                >
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={displayName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-nordic-highlight">{displayName.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                
                <div className="space-y-1">
                   <h1 className="text-2xl sm:text-3xl font-bold">{displayName}</h1>
                   <div className={`flex flex-wrap gap-2 text-sm font-medium ${!hasCustomTheme ? tokens.textMuted : 'opacity-80'}`}>
                      {user.jobTitle && <span className="flex items-center gap-1"><SocialIcon fallbackIcon="job" size={14}/> {user.jobTitle}</span>}
                      {company && <span>@ {company}</span>}
                   </div>
                   {user.location && (
                      <div className="text-xs opacity-70 flex items-center gap-1 pt-1">
                          <SocialIcon fallbackIcon="location" size={12}/> {user.location}
                      </div>
                   )}
                </div>
            </div>
            {headline && (
               <p className={`mt-6 text-sm leading-relaxed border-l-4 border-white/20 pl-4 py-2 italic bg-white/5 rounded-r-lg ${!hasCustomTheme ? tokens.textMuted : 'opacity-80'}`}>&quot;{headline}&quot;</p>
            )}
          </div>

          {/* --- CONTACT GRID (MED NYA KNAPP-STILAR) --- */}
          <div className="grid grid-cols-2 gap-3 p-6 border-b border-white/5">
             {user.businessPhone && (
                <a href={`tel:${user.businessPhone}`} className={getButtonClass()} style={getButtonStyle()}>
                   <SocialIcon fallbackIcon="phone" size={16} /> Ring
                </a>
             )}
             {user.businessEmail && (
                <a href={`mailto:${user.businessEmail}`} className={getButtonClass()} style={getButtonStyle()}>
                   <SocialIcon fallbackIcon="email" size={16} /> Maila
                </a>
             )}
             {user.companyWebsite && (
                <a href={user.companyWebsite.startsWith('http') ? user.companyWebsite : `https://${user.companyWebsite}`} target="_blank" className={`col-span-2 ${getButtonClass()}`} style={getButtonStyle()}>
                   <SocialIcon fallbackIcon="website" size={16} /> Besök hemsida
                </a>
             )}
          </div>

          {/* --- LINKS (MED NYA KNAPP-STILAR) --- */}
          {user.links.length > 0 && (
             <div className="p-6 bg-black/10">
                <h3 className="text-xs font-bold opacity-60 uppercase tracking-wider mb-4">Resurser & Länkar</h3>
                <div className="space-y-3">
                   {user.links.map((link) => (
                      <TrackedLink
                         key={link.id}
                         linkId={link.id}
                         ownerId={user.id}
                         href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                         className={getButtonClass()}
                         style={getButtonStyle()}
                      >
                          <div className="absolute left-4 opacity-70">
                             <SocialIcon url={link.url || link.title} size={20} />
                          </div>
                          <span className="flex-1 text-center">{link.title || link.url}</span>
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