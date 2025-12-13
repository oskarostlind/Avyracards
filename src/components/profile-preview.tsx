import Image from "next/image";
import { ThemeName, getTheme } from "@/utils/theme";
import { CustomThemeSettings, defaultSettings } from "@/types/theme";

// VIKTIGT: En flexibel typ som funkar för både Settings, Dashboard och Theme Editor
export interface PreviewLink {
  id: string;
  url: string;
  title?: string | null; // Kan komma som title
  label?: string | null; // ...eller label
  icon?: string | null;
  isVisible?: boolean;   // Valfri
  clicks?: number;       // Valfri
  order?: number;        // Valfri
}

export interface ProfilePreviewProps {
  username: string;
  bio?: string | null;
  profileImage?: string | null;
  theme?: ThemeName | null;
  links: PreviewLink[]; // Vi använder den nya flexibla typen här
  profileMode?: "SOCIAL" | "BUSINESS" | null;
  customSettings?: CustomThemeSettings;
}

export function ProfilePreview({
  username,
  bio,
  profileImage,
  theme,
  links,
  // Fix för ESLint: Vi döper om prop:en lokalt till _profileMode
  profileMode: _profileMode = "SOCIAL", 
  customSettings,
}: ProfilePreviewProps) {
  
  const activeSettings = customSettings || defaultSettings;
  const isCustomMode = !!customSettings;
  const themeTokens = getTheme(theme);

  const customStyles = isCustomMode ? {
    backgroundColor: activeSettings.backgroundColor,
    color: activeSettings.textColor,
  } : {};

  // Knapp-stilar
  const getButtonStyle = () => {
    if (!isCustomMode) return themeTokens.link;
    
    let classes = "flex items-center justify-between w-full px-5 py-3.5 transition-all text-sm ";
    
    // Form
    if (activeSettings.buttonStyle === "pill") classes += "rounded-full ";
    else if (activeSettings.buttonStyle === "rounded") classes += "rounded-xl ";
    else if (activeSettings.buttonStyle === "sharp") classes += "rounded-none ";
    else if (activeSettings.buttonStyle === "brutal") classes += "rounded-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ";

    // Variant
    if (activeSettings.buttonVariant === "shadow") classes += "shadow-lg hover:shadow-xl hover:scale-[1.02] ";
    
    return classes;
  };

  // Inline styles för knappar
  const getButtonInlineStyle = () => {
    if (!isCustomMode) return {};
    
    const bg = activeSettings.accentColor;
    const variant = activeSettings.buttonVariant;

    if (variant === "outline") return { border: `2px solid ${bg}`, color: activeSettings.textColor };
    if (variant === "glass") return { backgroundColor: `${bg}30`, backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" };
    
    // Solid default
    return { backgroundColor: bg, color: "#ffffff" }; 
  };

  // Profilbild-ram
  const getFrameClass = () => {
    if (!isCustomMode) return "rounded-full";
    const s = activeSettings.frameStyle;
    if (s === "rounded") return "rounded-2xl";
    if (s === "none") return "rounded-none";
    return "rounded-full";
  };

  return (
    <div 
      className={`h-full w-full overflow-y-auto no-scrollbar ${!isCustomMode ? themeTokens.bg : ''}`}
      style={customStyles}
    >
      <div className="flex flex-col items-center px-6 py-10 text-center min-h-full max-w-md mx-auto">
        
        {/* Avatar */}
        <div className={`relative mb-4 h-24 w-24 shrink-0 overflow-hidden shadow-2xl ${getFrameClass()}`}
             style={isCustomMode && activeSettings.frameStyle === "glow" ? { boxShadow: `0 0 30px ${activeSettings.accentColor}` } : {}}
        >
          {profileImage ? (
            <Image src={profileImage} alt={username} fill className="object-cover" unoptimized />
          ) : (
            <div className={`flex h-full w-full items-center justify-center text-3xl font-bold ${isCustomMode ? "bg-white/10" : "bg-slate-800 text-white"}`}>
              {username.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        {/* Text */}
        <h1 className="mb-1 text-xl font-bold tracking-tight">{username}</h1>
        {bio && <p className="mb-6 text-sm opacity-80 leading-relaxed max-w-[280px]">{bio}</p>}

        {/* Länkar */}
        <div className="w-full space-y-3">
          {links.length === 0 && (
            <div className="p-4 border border-dashed border-white/20 rounded-xl text-xs opacity-50">
               Inga länkar tillagda än.
            </div>
          )}
          {links.map((link) => (
            <a
              key={link.id}
              href="#"
              className={getButtonStyle()}
              style={getButtonInlineStyle()}
              onClick={(e) => e.preventDefault()}
            >
              {/* Hanterar både title och label */}
              <span className="font-medium mx-auto">{link.title || link.label || link.url}</span>
            </a>
          ))}
        </div>

        {/* Branding */}
        <div className="mt-auto pt-8 pb-4">
           <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">SocialCard</span>
        </div>
      </div>
    </div>
  );
}