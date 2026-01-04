"use client";

import { CustomThemeSettings, defaultSettings } from "@/types/theme";
import { 
  Globe, Instagram, Linkedin, Twitter, Mail, 
  Facebook, Github, Youtube, Link as LinkIcon 
} from "lucide-react";
import { User } from "lucide-react";

export interface PreviewLink {
  id: string;
  url: string;
  title?: string | null;
  label?: string | null;
  icon?: string | null;
  isVisible?: boolean;
}

export interface ProfilePreviewProps {
  username: string;
  name?: string | null;      
  bio?: string | null;
  avatarUrl?: string | null;
  links: PreviewLink[];
  customSettings?: CustomThemeSettings;
  fullscreen?: boolean;
}

const fontMap: Record<string, string> = {
  inter: "var(--font-inter), sans-serif",
  playfair: "'Playfair Display', serif",
  roboto: "'Roboto', sans-serif",
  lora: "'Lora', serif",
  space: "'Space Grotesk', sans-serif",
  oswald: "'Oswald', sans-serif",
};

export function ProfilePreview({
  username,
  name,
  bio,
  avatarUrl,
  links,
  customSettings,
  fullscreen = false,
}: ProfilePreviewProps) {
  
  const settings = customSettings || defaultSettings;
  const currentFont = settings.font && fontMap[settings.font] ? fontMap[settings.font] : fontMap['inter'];

  // --- BAKGRUND (Page Level) ---
  let bgStyle: React.CSSProperties = {};

  if (settings.backgroundType === "image" && settings.backgroundImage) {
    bgStyle = {
      backgroundImage: `url(${settings.backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: fullscreen ? "fixed" : "scroll",
    };
  } else if (settings.backgroundType === "gradient") {
    bgStyle = {
      background: `linear-gradient(${settings.gradientDir || "to bottom right"}, ${settings.gradientFrom || "#000"}, ${settings.gradientTo || "#000"})`,
      backgroundAttachment: fullscreen ? "fixed" : "scroll",
    };
  } else {
    bgStyle = { backgroundColor: settings.backgroundColor || "#0f172a" };
  }

  // --- KNAPPAR (Inga inline-borders här för att undvika konflikter) ---
  const getButtonClass = () => {
    let base = "w-full py-4 px-6 font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group ";
    
    // Form
    if (settings.buttonStyle === "pill") base += "rounded-full ";
    else if (settings.buttonStyle === "rounded") base += "rounded-xl ";
    else if (settings.buttonStyle === "sharp") base += "rounded-none ";
    else if (settings.buttonStyle === "brutal") base += "rounded-sm shadow-[4px_4px_0px_0px_currentColor] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ";
    
    // Skugga (ej för brutal)
    if (settings.buttonShadow && settings.buttonStyle !== "brutal") base += "shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 ";

    return base;
  };

  const getButtonStyle = (): React.CSSProperties => {
    const accent = settings.accentColor || "#fff";
    const text = settings.textColor || "#000";
    const style: React.CSSProperties = {};

    style.color = text;

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
    } 
    else if (settings.buttonVariant === "glass") {
      style.backgroundColor = "rgba(255,255,255,0.15)";
      style.backdropFilter = "blur(8px)";
      style.border = "1px solid rgba(255,255,255,0.2)";
    }
    else if (settings.buttonVariant === "ghost") {
      style.backgroundColor = "transparent";
    }
    else if (settings.buttonVariant === "shadow") {
      style.backgroundColor = accent;
      style.boxShadow = `0 10px 15px -3px ${accent}40`;
    }
    else {
      // Solid (Default)
      style.backgroundColor = accent;
    }
    
    return style;
  };

  const getFrameClass = () => {
    if (settings.frameStyle === "circle") return "rounded-full";
    if (settings.frameStyle === "rounded") return "rounded-3xl";
    if (settings.frameStyle === "hexagon") return "hexagon-clip"; 
    if (settings.frameStyle === "none") return "rounded-none";
    if (settings.frameStyle === "ring") return "rounded-full ring-4 ring-offset-4 ring-offset-transparent";
    return "rounded-full"; 
  };

  const renderIcon = (iconName?: string | null) => {
    if (!iconName) return null;
    const size = 18;
    const lower = iconName.toLowerCase();
    if (lower.includes("insta")) return <Instagram size={size} />;
    if (lower.includes("linkedin")) return <Linkedin size={size} />;
    if (lower.includes("twitter") || lower.includes("x")) return <Twitter size={size} />;
    if (lower.includes("facebook")) return <Facebook size={size} />;
    if (lower.includes("github")) return <Github size={size} />;
    if (lower.includes("youtube")) return <Youtube size={size} />;
    if (lower.includes("mail")) return <Mail size={size} />;
    if (lower.includes("web") || lower.includes("hemsida")) return <Globe size={size} />;
    if (lower.includes("boka") || lower.includes("cal")) return <LinkIcon size={size} />;
    return <LinkIcon size={size} />;
  };

  return (
    // MAIN CONTAINER: Centrerar allt, sköter bakgrunden
    <div 
      className={`w-full relative overflow-x-hidden flex flex-col items-center justify-center p-4 ${fullscreen ? 'min-h-screen py-16' : 'h-full overflow-y-auto py-10'}`}
      style={{ fontFamily: currentFont, ...bgStyle }}
    >
      
      {/* BACKGROUND OVERLAY (Endast om bild + blur/darken är vald) */}
      {settings.backgroundType === "image" && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ 
            backgroundColor: `rgba(0,0,0, ${settings.backgroundOverlay ? settings.backgroundOverlay / 100 : 0})`,
            backdropFilter: `blur(${settings.backgroundBlur || 0}px)`,
            position: fullscreen ? 'fixed' : 'absolute',
            height: '100%',
            width: '100%'
          }}
        />
      )}

      {/* --- CARD CONTAINER --- 
          Detta är det "svävande kortet". 
          Vi flyttar footern UTANFÖR denna div. 
      */}
      <div 
        className={`
          relative z-10 w-full max-w-[380px]
          flex flex-col items-center
          p-8 mb-6
          bg-nordic-primary/60 backdrop-blur-xl
          border border-white/10
          rounded-[2.5rem]
          shadow-2xl
        `}
        style={{ color: settings.textColor || "#fff" }}
      >
        
        {/* Avatar */}
        <div 
          className={`relative mb-6 shrink-0 transition-transform hover:scale-105 duration-500 ${getFrameClass()}`}
          style={settings.frameStyle === 'glow' ? { 
            boxShadow: `0 0 30px ${settings.accentColor}`,
            borderRadius: '9999px' 
          } : settings.frameStyle === 'ring' ? {
            borderColor: settings.accentColor
          } : {}}
        >
          {avatarUrl ? (
             // eslint-disable-next-line @next/next/no-img-element
             <img 
               src={avatarUrl} 
               alt="Profil" 
               className={`w-28 h-28 object-cover border-2 border-white/10 ${getFrameClass()}`} 
               style={settings.frameStyle === 'ring' ? { borderRadius: '9999px' } : {}}
             />
          ) : (
             <div className={`w-28 h-28 bg-white/10 flex items-center justify-center text-nordic-secondary/50 border-2 border-white/10 ${getFrameClass()}`}>
               <User size={40} />
             </div>
          )}
        </div>

        {/* Namn & Bio */}
        <div className="text-center space-y-2 mb-8 w-full">
          <h1 className="text-2xl font-bold tracking-tight">
            {name || username || "Ditt Namn"}
          </h1>
          
          {bio && (
            <div className="text-sm opacity-80 leading-relaxed whitespace-pre-line font-medium break-words">
              {bio}
            </div>
          )}
        </div>

        {/* Länkar */}
        <div className="w-full space-y-3">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={getButtonClass()}
              style={getButtonStyle()}
            >
               <span className="opacity-80 absolute left-5">{renderIcon(link.title || link.url)}</span>
               <span className="flex-1 text-center truncate px-6">{link.title || link.label || link.url}</span>
            </a>
          ))}
          
          {links.length === 0 && (
             <div className="p-6 border-2 border-dashed border-white/20 rounded-2xl text-center text-nordic-secondary/50 text-xs">
                Inga länkar tillagda ännu.
             </div>
          )}
        </div>

      </div>

      {/* --- FOOTER (Nu utanför kortet) --- */}
      <div className="relative z-10 mt-auto opacity-70 hover:opacity-100 transition-opacity">
         <a href="https://avyracards.se" target="_blank" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-nordic-secondary no-underline drop-shadow-md">
           <span>Powered by AvyraCards</span>
         </a>
      </div>

    </div>
  );
}