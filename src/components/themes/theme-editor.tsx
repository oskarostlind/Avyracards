"use client";

import { useState } from "react";
import { 
  Palette, 
  LayoutTemplate, 
  Type, 
  User, 
  Save, 
  RotateCcw,
  Loader2,
  type LucideIcon 
} from "lucide-react";
import { 
  type CustomThemeSettings, 
  defaultSettings, 
  type ButtonStyle, 
  type ButtonVariant, 
  type FrameStyle, 
  type Font 
} from "@/types/theme";
import { ProfilePreview, type PreviewLink } from "@/components/profile-preview"; // Importera PreviewLink
import { useRouter } from "next/navigation";

// Mock-länkar så användaren ser hur knapparna ser ut
const MOCK_LINKS: PreviewLink[] = [
  { id: "1", title: "Instagram", url: "#", icon: "instagram" },
  { id: "2", title: "Min Hemsida", url: "#", icon: "globe" },
  { id: "3", title: "Boka tid", url: "#", icon: "calendar" },
];

export function ThemeEditor({ initialSettings }: { initialSettings?: CustomThemeSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState<CustomThemeSettings>(initialSettings || defaultSettings);
  const [activeTab, setActiveTab] = useState<"colors" | "buttons" | "profile" | "fonts">("colors");
  const [isSaving, setIsSaving] = useState(false);

  // Generell uppdateringsfunktion
  const updateSetting = (key: keyof CustomThemeSettings, value: string | number) => {
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
    <div className="flex flex-col h-[calc(100vh-64px)] lg:flex-row bg-black">
      
      {/* --- PREVIEW AREA --- */}
      <div className="flex-1 relative overflow-hidden bg-slate-900 flex items-center justify-center p-4">
        {/* Vi skalar ner previewen lite för att allt ska synas utan scroll */}
        <div className="transform scale-90 sm:scale-100 w-full max-w-xs h-[600px] border-[8px] border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl bg-black ring-1 ring-white/10">
           {/* HÄR SKICKAR VI IN MOCK LINKS */}
           <ProfilePreview 
             username="Oskar" 
             bio="Digital Creator" 
             links={MOCK_LINKS} 
             customSettings={settings} 
           />
        </div>
      </div>

      {/* --- EDITOR PANEL --- */}
      <div className="lg:w-80 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col z-20">
        
        {/* Verktygsmeny */}
        <div className="flex justify-between px-2 pt-2 border-b border-slate-800">
          <TabButton active={activeTab === "colors"} onClick={() => setActiveTab("colors")} icon={Palette} label="Färger" />
          <TabButton active={activeTab === "buttons"} onClick={() => setActiveTab("buttons")} icon={LayoutTemplate} label="Knappar" />
          <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={User} label="Profil" />
          <TabButton active={activeTab === "fonts"} onClick={() => setActiveTab("fonts")} icon={Type} label="Font" />
        </div>

        {/* Innehåll (Mer kompakt padding) */}
        <div className="flex-1 p-4 overflow-y-auto space-y-5">
          
          {activeTab === "colors" && (
            <div className="space-y-4">
              <ColorPicker label="Bakgrund" value={settings.backgroundColor} onChange={(v) => updateSetting("backgroundColor", v)} />
              <ColorPicker label="Accent" value={settings.accentColor} onChange={(v) => updateSetting("accentColor", v)} />
              <ColorPicker label="Textfärg" value={settings.textColor} onChange={(v) => updateSetting("textColor", v)} />
            </div>
          )}

          {activeTab === "buttons" && (
            <div className="space-y-5">
              <OptionGrid 
                label="Form" 
                current={settings.buttonStyle} 
                onSelect={(v) => updateSetting("buttonStyle", v as ButtonStyle)} 
                options={[
                  { value: "rounded", label: "Soft" },
                  { value: "pill", label: "Pill" },
                  { value: "sharp", label: "Sharp" },
                  { value: "brutal", label: "Brutal" },
                ]} 
              />
              <OptionGrid 
                label="Stil" 
                current={settings.buttonVariant} 
                onSelect={(v) => updateSetting("buttonVariant", v as ButtonVariant)} 
                options={[
                  { value: "solid", label: "Solid" },
                  { value: "outline", label: "Ram" },
                  { value: "glass", label: "Glas" },
                  { value: "shadow", label: "Skugga" },
                ]} 
              />
            </div>
          )}

          {activeTab === "profile" && (
             <div className="space-y-4">
                <OptionGrid 
                  label="Ram & Effekt" 
                  current={settings.frameStyle} 
                  onSelect={(v) => updateSetting("frameStyle", v as FrameStyle)}
                  options={[
                    { value: "none", label: "Ingen" },
                    { value: "circle", label: "Cirkel" },
                    { value: "rounded", label: "Fyrkant" },
                    { value: "glow", label: "Glow" },
                  ]}
                />
             </div>
          )}

          {activeTab === "fonts" && (
             <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Välj Typsnitt</p>
                <div className="grid grid-cols-2 gap-2">
                   {(["inter", "playfair", "roboto", "space"] as Font[]).map((font) => (
                      <button 
                        key={font}
                        onClick={() => updateSetting("font", font)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                           settings.font === font 
                           ? "border-purple-500 bg-purple-500/10 text-white" 
                           : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                         <span className="text-xs font-medium capitalize text-slate-200">{font}</span>
                      </button>
                   ))}
                </div>
             </div>
          )}

        </div>

        {/* Action Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
          <button 
            onClick={() => setSettings(initialSettings || defaultSettings)}
            className="p-3 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition"
            title="Återställ"
          >
             <RotateCcw size={18} />
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-white text-black font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-slate-200 transition text-sm"
          >
             {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save size={16}/> Spara Design</>}
          </button>
        </div>

      </div>
    </div>
  );
}

// --- HJÄLPKOMPONENTER (Mindre och kompaktare) ---

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}

function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-all ${
        active ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
      }`}
    >
      <Icon size={18} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

interface ColorPickerProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
   return (
      <div className="space-y-1.5">
         <div className="flex justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase">{label}</label>
            <span className="text-[10px] font-mono text-slate-600">{value}</span>
         </div>
         <div className="flex gap-2 items-center">
            <input 
               type="color" 
               value={value || "#000000"} 
               onChange={(e) => onChange(e.target.value)}
               className="h-8 w-8 rounded-lg cursor-pointer bg-transparent border-none p-0"
            />
            <div className="flex-1 h-8 rounded-lg border border-white/10" style={{ backgroundColor: value }}></div>
         </div>
      </div>
   )
}

interface OptionGridProps {
  label: string;
  options: { value: string; label: string }[];
  current?: string;
  onSelect: (val: string) => void;
}

function OptionGrid({ label, options, current, onSelect }: OptionGridProps) {
   return (
      <div className="space-y-2">
         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
         <div className="grid grid-cols-2 gap-2"> 
            {options.map((opt) => (
               <button
                  key={opt.value}
                  onClick={() => onSelect(opt.value)}
                  className={`py-2 px-1 rounded-md text-xs font-medium border transition-all ${
                     current === opt.value 
                     ? "border-purple-500 bg-purple-500 text-white shadow-md shadow-purple-500/20" 
                     : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-600"
                  }`}
               >
                  {opt.label}
               </button>
            ))}
         </div>
      </div>
   )
}