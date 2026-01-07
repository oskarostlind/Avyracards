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
  type LucideIcon 
} from "lucide-react";

import { type CustomThemeSettings, defaultSettings } from "@/types/theme";
import { ProfilePreview, type PreviewLink } from "@/components/profile-preview";
import { useRouter } from "next/navigation";
import { UpgradeModal } from "@/components/themes/upgrade-modal"; 

import { TemplatesTab } from "./tabs/templates-tab";
import { BackgroundTab } from "./tabs/background-tab";
import { ButtonsTab } from "./tabs/buttons-tab";
import { ProfileTab } from "./tabs/profile-tab";

interface ThemeEditorProps {
  initialSettings: CustomThemeSettings;
  userData: {
    username: string;
    name: string;
    bio: string;
    avatarUrl: string;
    links: PreviewLink[];
    isPremium?: boolean;
    
    // --- NYA FÄLT I INTERFACET ---
    profileMode?: "SOCIAL" | "BUSINESS";
    jobTitle?: string | null;
    companyName?: string | null;
    location?: string | null;
    businessEmail?: string | null;
    businessPhone?: string | null;
    companyWebsite?: string | null;
  }
}

export function ThemeEditor({ initialSettings, userData }: ThemeEditorProps) {
  const router = useRouter();
  
  const [settings, setSettings] = useState<CustomThemeSettings>({ ...defaultSettings, ...initialSettings });
  const [activeTab, setActiveTab] = useState<"templates" | "background" | "buttons" | "profile">("templates");
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isUserPremium = userData.isPremium || false;

  const updateSetting = (key: keyof CustomThemeSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/themes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.status === 403) {
        setIsSaving(false);
        setShowUpgradeModal(true); 
        return;
      }

      if (res.ok) router.refresh();
      
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
        
        <div className="transform scale-[0.55] sm:scale-[0.70] lg:scale-[0.85] xl:scale-100 transition-transform duration-500 w-[375px] h-[750px] border-[8px] border-nordic-highlight/40 rounded-[3rem] overflow-hidden shadow-2xl bg-nordic-primary ring-1 ring-white/10 relative z-10 shrink-0 origin-center">
           <ProfilePreview 
             username={userData.username}
             name={userData.name}
             bio={userData.bio}
             avatarUrl={userData.avatarUrl}
             links={userData.links} 
             customSettings={settings} 
             
             // --- SKICKA DATAN TILL PREVIEWN ---
             profileMode={userData.profileMode}
             jobTitle={userData.jobTitle}
             companyName={userData.companyName}
             location={userData.location}
             businessEmail={userData.businessEmail}
             businessPhone={userData.businessPhone}
             companyWebsite={userData.companyWebsite}
             // ----------------------------------
           />
        </div>
      </div>

      {/* --- RIGHT: EDITOR PANEL --- */}
      <div className="h-[55%] lg:h-full lg:w-96 bg-nordic-primary flex flex-col z-20 shadow-2xl">
        
        {/* Navigation */}
        <div className="grid grid-cols-4 border-b border-nordic-highlight/40 shrink-0">
          <TabButton active={activeTab === "templates"} onClick={() => setActiveTab("templates")} icon={LayoutTemplate} label="Mallar" />
          <TabButton active={activeTab === "background"} onClick={() => setActiveTab("background")} icon={ImageIcon} label="Bakgrund" />
          <TabButton active={activeTab === "buttons"} onClick={() => setActiveTab("buttons")} icon={BoxSelect} label="Knappar" />
          <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={User} label="Profil" />
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
          
          {activeTab === "templates" && (
            <TemplatesTab 
                isPremium={isUserPremium} 
                onApply={(t) => setSettings(prev => ({ ...prev, ...t.settings }))} 
            />
          )}

          {activeTab === "background" && (
            <BackgroundTab 
                settings={settings} 
                updateSetting={updateSetting} 
                isPremium={isUserPremium}
                onShowUpgrade={() => setShowUpgradeModal(true)}
            />
          )}

          {activeTab === "buttons" && (
            <ButtonsTab 
                settings={settings} 
                updateSetting={updateSetting} 
                isPremium={isUserPremium}
            />
          )}

          {activeTab === "profile" && (
            <ProfileTab 
                settings={settings} 
                updateSetting={updateSetting} 
                isPremium={isUserPremium}
            />
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-nordic-highlight/40 bg-nordic-primary flex gap-3 shrink-0 z-30 relative">
          <button 
            onClick={() => setSettings(initialSettings)}
            className="p-3 rounded-xl bg-slate-900 text-nordic-highlight hover:text-nordic-secondary transition"
            title="Återställ"
          >
             <RotateCcw size={18} />
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-nordic-secondary text-nordic-primary font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-nordic-support transition text-sm shadow-lg shadow-nordic-accent/10"
          >
             {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save size={16}/> Spara Design</>}
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