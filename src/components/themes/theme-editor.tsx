"use client";

import { useState } from "react";
import { 
  LayoutTemplate, 
  User, 
  Save, 
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  BoxSelect,
  Briefcase,
  Share2,
  type LucideIcon 
} from "lucide-react";

import { type CustomThemeSettings, defaultSettings, type ThemeMode } from "@/types/theme";
import { ProfilePreview, type PreviewLink } from "@/components/profile-preview";
import { useRouter } from "next/navigation";
import { UpgradeModal } from "@/components/themes/upgrade-modal"; 

import { TemplatesTab } from "./tabs/templates-tab";
import { BackgroundTab } from "./tabs/background-tab";
import { ButtonsTab } from "./tabs/buttons-tab";
import { ProfileTab } from "./tabs/profile-tab";

interface ThemeEditorProps {
  initialSettings: CustomThemeSettings; 
  initialBusinessSettings: CustomThemeSettings;
  
  userData: {
    username: string;
    name: string;
    bio: string;
    avatarUrl: string;
    links: PreviewLink[];
    isPremium?: boolean;
    
    // Default mode
    profileMode?: ThemeMode;
    
    // Business data
    jobTitle?: string | null;
    companyName?: string | null;
    location?: string | null;
    
    businessHeadline?: string | null;
    businessEmail?: string | null;
    businessPhone?: string | null;
    companyWebsite?: string | null;

    // --- NYA SOCIALA FÄLT ---
    contactEmail?: string | null;
    phoneNumber?: string | null;
  }
}

export function ThemeEditor({ initialSettings, initialBusinessSettings, userData }: ThemeEditorProps) {
  const router = useRouter();
  
  // --- STATE ---
  const [mode, setMode] = useState<ThemeMode>(userData.profileMode || "SOCIAL");
  
  const [socialSettings, setSocialSettings] = useState<CustomThemeSettings>({ ...defaultSettings, ...initialSettings });
  const [businessSettings, setBusinessSettings] = useState<CustomThemeSettings>({ ...defaultSettings, ...initialBusinessSettings });

  // UI State
  const [activeTab, setActiveTab] = useState<"templates" | "background" | "buttons" | "profile">("templates");
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isUserPremium = userData.isPremium || false;

  // --- GETTERS & SETTERS ---
  const currentSettings = mode === "BUSINESS" ? businessSettings : socialSettings;

  const updateSetting = (key: keyof CustomThemeSettings, value: any) => {
    if (mode === "BUSINESS") {
        setBusinessSettings(prev => ({ ...prev, [key]: value }));
    } else {
        setSocialSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const applyTemplate = (newSettings: Partial<CustomThemeSettings>) => {
    if (mode === "BUSINESS") {
        setBusinessSettings(prev => ({ ...prev, ...newSettings }));
    } else {
        setSocialSettings(prev => ({ ...prev, ...newSettings }));
    }
  };

  const handleReset = () => {
      if (mode === "BUSINESS") {
          setBusinessSettings({ ...defaultSettings, ...initialBusinessSettings });
      } else {
          setSocialSettings({ ...defaultSettings, ...initialSettings });
      }
  };

  // --- SAVE ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/themes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            mode: mode, 
            settings: currentSettings 
        }),
      });

      if (res.status === 403) {
        setIsSaving(false);
        setShowUpgradeModal(true); 
        return;
      }

      if (res.ok) {
          router.refresh();
      }
      
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setIsSaving(false), 500); 
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:flex-row bg-nordic-primary overflow-hidden">
      
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* --- LEFT: LIVE PREVIEW --- */}
      <div className="h-[45%] lg:h-full lg:flex-1 relative bg-[#050505] flex items-center justify-center p-4 overflow-hidden border-b lg:border-b-0 lg:border-r border-nordic-highlight/40">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* Toggle Overlay i Preview */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-nordic-secondary shadow-lg">
             {mode === "BUSINESS" ? "Business Mode" : "Social Mode"}
        </div>

        <div className="transform scale-[0.55] sm:scale-[0.70] lg:scale-[0.85] xl:scale-100 transition-transform duration-500 w-[375px] h-[750px] border-[8px] border-nordic-highlight/40 rounded-[3rem] overflow-hidden shadow-2xl bg-nordic-primary ring-1 ring-white/10 relative z-10 shrink-0 origin-center">
           <ProfilePreview 
             username={userData.username}
             name={userData.name}
             bio={userData.bio}
             avatarUrl={userData.avatarUrl}
             links={userData.links} 
             
             customSettings={currentSettings} 
             profileMode={mode}

             jobTitle={userData.jobTitle}
             companyName={userData.companyName}
             location={userData.location}
             
             businessHeadline={userData.businessHeadline}
             businessEmail={userData.businessEmail}
             businessPhone={userData.businessPhone}
             companyWebsite={userData.companyWebsite}

             // NYA PROPS: Skickar med social kontaktdata till preview
             contactEmail={userData.contactEmail}
             phoneNumber={userData.phoneNumber}
           />
        </div>
      </div>

      {/* --- RIGHT: EDITOR PANEL --- */}
      <div className="h-[55%] lg:h-full lg:w-96 bg-nordic-primary flex flex-col z-20 shadow-2xl border-l border-nordic-highlight/20">
        
        {/* --- TOP: MODE SWITCHER --- */}
        <div className="p-4 border-b border-nordic-highlight/40 bg-slate-900/50">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
                <button
                    onClick={() => setMode("SOCIAL")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                        mode === "SOCIAL" 
                        ? "bg-purple-600 text-white shadow-md" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <Share2 size={14} /> Social
                </button>
                <button
                    onClick={() => setMode("BUSINESS")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                        mode === "BUSINESS" 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <Briefcase size={14} /> Business
                </button>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 border-b border-nordic-highlight/40 shrink-0 bg-nordic-primary">
          <TabButton active={activeTab === "templates"} onClick={() => setActiveTab("templates")} icon={LayoutTemplate} label="Mallar" />
          <TabButton active={activeTab === "background"} onClick={() => setActiveTab("background")} icon={ImageIcon} label="Bakgrund" />
          <TabButton active={activeTab === "buttons"} onClick={() => setActiveTab("buttons")} icon={BoxSelect} label="Knappar" />
          <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={User} label="Profil" />
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar relative">
          
          <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
             {mode === "BUSINESS" ? <Briefcase size={100} /> : <Share2 size={100} />}
          </div>

          <div className="relative z-10">
            {activeTab === "templates" && (
                <TemplatesTab 
                    isPremium={isUserPremium} 
                    onApply={(t) => applyTemplate(t.settings)}
                    mode={mode}
                />
            )}

            {activeTab === "background" && (
                <BackgroundTab 
                    settings={currentSettings} 
                    updateSetting={updateSetting} 
                    isPremium={isUserPremium}
                    onShowUpgrade={() => setShowUpgradeModal(true)}
                />
            )}

            {activeTab === "buttons" && (
                <ButtonsTab 
                    settings={currentSettings} 
                    updateSetting={updateSetting} 
                    isPremium={isUserPremium}
                />
            )}

            {activeTab === "profile" && (
                <ProfileTab 
                    settings={currentSettings} 
                    updateSetting={updateSetting} 
                    isPremium={isUserPremium}
                />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-nordic-highlight/40 bg-nordic-primary flex gap-3 shrink-0 z-30 relative">
          <button 
            onClick={handleReset}
            className="p-3 rounded-xl bg-slate-900 text-nordic-highlight hover:text-nordic-secondary transition"
            title="Återställ ändringar för detta läge"
          >
             <RotateCcw size={18} />
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition text-sm shadow-lg ${
                mode === "BUSINESS" 
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20" 
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20"
            }`}
          >
             {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save size={16}/> Spara {mode === "BUSINESS" ? "Business" : "Social"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: LucideIcon; label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 py-4 border-b-2 transition-all ${active ? "border-purple-500 text-nordic-secondary bg-slate-900" : "border-transparent text-nordic-highlight hover:text-slate-300 hover:bg-slate-900/50"}`}>
      <Icon size={18} />
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </button>
  );
}