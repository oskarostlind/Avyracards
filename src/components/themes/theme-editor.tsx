"use client";

import { useState } from "react";
import { 
  LayoutTemplate, 
  User, 
  Save, 
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  Wand2,
  BoxSelect,
  type LucideIcon 
} from "lucide-react";
import { 
  type CustomThemeSettings, 
  defaultSettings, 
  type ButtonStyle, 
  type ButtonVariant, 
  type FrameStyle, 
  type Font,
} from "@/types/theme";
import { ProfilePreview, type PreviewLink } from "@/components/profile-preview";
import { useRouter } from "next/navigation";

// --- MALLAR (PRESETS) ---
const TEMPLATES: { id: string; name: string; settings: Partial<CustomThemeSettings> }[] = [
  {
    id: "minimal",
    name: "Minimal",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      accentColor: "#000000",
      buttonStyle: "sharp",
      buttonVariant: "outline",
      font: "inter",
      frameStyle: "none",
      buttonShadow: false,
    }
  },
  {
    id: "corporate",
    name: "Corporate",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#1e293b",
      gradientTo: "#0f172a",
      gradientDir: "to bottom right",
      textColor: "#ffffff",
      accentColor: "#3b82f6",
      buttonStyle: "rounded",
      buttonVariant: "solid",
      font: "roboto",
      frameStyle: "circle",
      buttonShadow: true,
    }
  },
  {
    id: "creative",
    name: "Creative",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#000000",
      textColor: "#ffffff",
      accentColor: "#d946ef",
      buttonStyle: "brutal",
      buttonVariant: "solid",
      font: "space",
      frameStyle: "rounded",
      buttonShadow: false,
    }
  },
  {
    id: "glass",
    name: "Glass",
    settings: {
      backgroundType: "image",
      backgroundImage: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000",
      backgroundBlur: 10,
      backgroundOverlay: 40,
      textColor: "#ffffff",
      accentColor: "#ffffff",
      buttonStyle: "pill",
      buttonVariant: "glass",
      font: "playfair",
      frameStyle: "glow",
      buttonShadow: true,
    }
  },
  // --- NYA MALLAR ---
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#09090b", // Almost black
      textColor: "#e4e4e7",
      accentColor: "#facc15", // Neon Yellow
      buttonStyle: "brutal",
      buttonVariant: "outline",
      font: "space", 
      frameStyle: "hexagon",
      buttonShadow: true,
    }
  },
  {
    id: "luxury",
    name: "Luxury",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#1c1917", // Warm dark grey
      gradientTo: "#000000",
      gradientDir: "to bottom",
      textColor: "#fafaf9", // Stone-50
      accentColor: "#d4af37", // Goldish
      buttonStyle: "sharp",
      buttonVariant: "outline",
      font: "playfair", 
      frameStyle: "ring",
      buttonShadow: false,
    }
  },
  {
    id: "nordic",
    name: "Nordic",
    settings: {
      backgroundType: "solid",
      backgroundColor: "#f1f5f9", // Slate-100
      textColor: "#334155", // Slate-700
      accentColor: "#475569", // Slate-600
      buttonStyle: "rounded",
      buttonVariant: "soft",
      font: "inter",
      frameStyle: "circle",
      buttonShadow: false,
    }
  },
  {
    id: "sunset",
    name: "Sunset",
    settings: {
      backgroundType: "gradient",
      gradientFrom: "#f43f5e", // Rose
      gradientTo: "#f59e0b", // Amber
      gradientDir: "to bottom right",
      textColor: "#fff",
      accentColor: "#fff",
      buttonStyle: "pill",
      buttonVariant: "glass",
      font: "roboto",
      frameStyle: "glow",
      buttonShadow: true,
    }
  }
];

interface ThemeEditorProps {
  initialSettings: CustomThemeSettings;
  userData: {
    username: string;
    name: string;
    bio: string;
    avatarUrl: string;
    links: PreviewLink[];
  }
}

export function ThemeEditor({ initialSettings, userData }: ThemeEditorProps) {
  const router = useRouter();
  
  // Vi slår ihop default med initial för att garantera att alla fält finns
  const [settings, setSettings] = useState<CustomThemeSettings>({ ...defaultSettings, ...initialSettings });
  
  const [activeTab, setActiveTab] = useState<"templates" | "background" | "buttons" | "profile">("templates");
  const [isSaving, setIsSaving] = useState(false);

  const updateSetting = (key: keyof CustomThemeSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const applyTemplate = (templateSettings: Partial<CustomThemeSettings>) => {
    setSettings(prev => ({ ...prev, ...templateSettings }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/themes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setIsSaving(false), 500); 
    }
  };

  return (
    // HUVUDCONTAINER: Låser höjden till skärmen minus header (ca 64px)
    <div className="flex flex-col h-[calc(100vh-64px)] lg:flex-row bg-black overflow-hidden">
      
      {/* --- LEFT: LIVE PREVIEW --- */}
      {/* På mobil: tar 45% av höjden. På desktop: Flex-1 (resten av bredden) */}
      <div className="h-[45%] lg:h-full lg:flex-1 relative bg-[#050505] flex items-center justify-center p-4 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
        
        {/* Rutnäts-bakgrund */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* TELEFON-RAMEN */}
        {/* VIKTIGT: Här skalar vi ner den rejält på mobil (scale-[0.55]) så den alltid syns */}
        <div className="transform scale-[0.55] sm:scale-[0.70] lg:scale-[0.85] xl:scale-100 transition-transform duration-500 w-[375px] h-[750px] border-[8px] border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl bg-black ring-1 ring-white/10 relative z-10 shrink-0 origin-center">
           <ProfilePreview 
             username={userData.username}
             name={userData.name}
             bio={userData.bio}
             avatarUrl={userData.avatarUrl}
             links={userData.links} 
             customSettings={settings} 
           />
        </div>
      </div>

      {/* --- RIGHT: EDITOR PANEL --- */}
      {/* På mobil: tar 55% av höjden. På desktop: fast bredd (24rem / 96) */}
      <div className="h-[55%] lg:h-full lg:w-96 bg-slate-950 flex flex-col z-20 shadow-2xl">
        
        {/* Tabs Navigation */}
        <div className="grid grid-cols-4 border-b border-slate-800 shrink-0">
          <TabButton active={activeTab === "templates"} onClick={() => setActiveTab("templates")} icon={LayoutTemplate} label="Mallar" />
          <TabButton active={activeTab === "background"} onClick={() => setActiveTab("background")} icon={ImageIcon} label="Bakgrund" />
          <TabButton active={activeTab === "buttons"} onClick={() => setActiveTab("buttons")} icon={BoxSelect} label="Knappar" />
          <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={User} label="Profil" />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-8">
          
          {/* MALLAR */}
          {activeTab === "templates" && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t.settings)}
                    className="group relative aspect-video rounded-xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-purple-500 transition-all text-left p-3 flex flex-col justify-end"
                  >
                    <div className={`absolute inset-0 opacity-50 transition-opacity group-hover:opacity-70 ${
                      t.id === 'minimal' ? 'bg-white' : 
                      t.id === 'creative' ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 
                      t.id === 'nordic' ? 'bg-slate-200' :
                      t.id === 'luxury' ? 'bg-[#1c1917]' :
                      t.id === 'sunset' ? 'bg-gradient-to-br from-rose-500 to-amber-500' :
                      t.id === 'corporate' ? 'bg-slate-800' : 'bg-[url(https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=200)] bg-cover'
                    }`} />
                    <span className={`relative z-10 text-xs font-bold ${t.id === 'minimal' || t.id === 'nordic' ? 'text-black' : 'text-white'}`}>{t.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 text-center">Välj en mall som grund och anpassa sedan.</p>
            </div>
          )}

          {/* BAKGRUND */}
          {activeTab === "background" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              
              <SegmentedControl 
                value={settings.backgroundType} 
                onChange={(v) => updateSetting("backgroundType", v)}
                options={[
                  { value: "solid", label: "Färg" },
                  { value: "gradient", label: "Gradient" },
                  { value: "image", label: "Bild" },
                ]}
              />

              {settings.backgroundType === "solid" && (
                <ColorPicker label="Bakgrundsfärg" value={settings.backgroundColor} onChange={(v) => updateSetting("backgroundColor", v)} />
              )}

              {settings.backgroundType === "gradient" && (
                <div className="space-y-4">
                  <ColorPicker label="Från färg" value={settings.gradientFrom} onChange={(v) => updateSetting("gradientFrom", v)} />
                  <ColorPicker label="Till färg" value={settings.gradientTo} onChange={(v) => updateSetting("gradientTo", v)} />
                </div>
              )}

              {settings.backgroundType === "image" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Bild URL</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={settings.backgroundImage || ""} 
                         onChange={(e) => updateSetting("backgroundImage", e.target.value)}
                         placeholder="https://..."
                         className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                       />
                       <button 
                         onClick={() => updateSetting("backgroundImage", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000")}
                         className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700" title="Slumpa"
                       >
                         <Wand2 size={14} className="text-purple-400"/>
                       </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase">Oskärpa (Blur)</label>
                      <span className="text-xs text-slate-400">{settings.backgroundBlur}px</span>
                    </div>
                    <input 
                      type="range" min="0" max="20" 
                      value={settings.backgroundBlur || 0} 
                      onChange={(e) => updateSetting("backgroundBlur", Number(e.target.value))}
                      className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase">Mörkare (Overlay)</label>
                      <span className="text-xs text-slate-400">{settings.backgroundOverlay}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="90" 
                      value={settings.backgroundOverlay || 0} 
                      onChange={(e) => updateSetting("backgroundOverlay", Number(e.target.value))}
                      className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KNAPPAR */}
          {activeTab === "buttons" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-500 uppercase">Knappform</label>
                 <div className="grid grid-cols-4 gap-2">
                    {['rounded', 'pill', 'sharp', 'brutal'].map((style) => (
                      <button 
                        key={style}
                        onClick={() => updateSetting("buttonStyle", style as ButtonStyle)}
                        className={`py-2 text-[10px] uppercase font-bold border rounded-lg transition-all ${
                          settings.buttonStyle === style 
                          ? "border-purple-500 bg-purple-500/10 text-purple-400" 
                          : "border-slate-800 text-slate-500 hover:border-slate-600"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                 </div>
               </div>

               <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-500 uppercase">Knappstil</label>
                 <div className="grid grid-cols-3 gap-2">
                    {['solid', 'outline', 'soft', 'glass', 'ghost'].map((variant) => (
                      <button 
                        key={variant}
                        onClick={() => updateSetting("buttonVariant", variant as ButtonVariant)}
                        className={`py-2 text-[10px] uppercase font-bold border rounded-lg transition-all ${
                          settings.buttonVariant === variant 
                          ? "border-purple-500 bg-purple-500/10 text-purple-400" 
                          : "border-slate-800 text-slate-500 hover:border-slate-600"
                        }`}
                      >
                        {variant}
                      </button>
                    ))}
                 </div>
               </div>

               <div className="flex items-center justify-between p-3 border border-slate-800 rounded-xl bg-slate-900/30">
                  <span className="text-xs font-bold text-slate-400 uppercase">Skugga</span>
                  <button 
                    onClick={() => updateSetting("buttonShadow", !settings.buttonShadow)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.buttonShadow ? 'bg-purple-500' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.buttonShadow ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
               </div>

               <hr className="border-slate-800"/>
               
               <ColorPicker label="Knappfärg (Accent)" value={settings.accentColor} onChange={(v) => updateSetting("accentColor", v)} />
               <ColorPicker label="Textfärg (Knappar)" value={settings.textColor} onChange={(v) => updateSetting("textColor", v)} />
            </div>
          )}

          {/* PROFIL */}
          {activeTab === "profile" && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-500 uppercase">Typsnitt</label>
                 <div className="grid grid-cols-2 gap-2">
                    {(["inter", "playfair", "roboto", "space", "oswald", "lora"] as Font[]).map((font) => (
                       <button 
                         key={font}
                         onClick={() => updateSetting("font", font)}
                         className={`p-3 rounded-lg border text-center transition-all ${
                            settings.font === font 
                            ? "border-purple-500 bg-purple-500/10 text-white" 
                            : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800"
                         }`}
                       >
                          <span className="text-sm capitalize" style={{ fontFamily: font === 'inter' ? 'Inter' : font }}>{font}</span>
                       </button>
                    ))}
                 </div>
               </div>

               <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-500 uppercase">Profilbild Ram</label>
                 <div className="grid grid-cols-3 gap-2">
                    {['none', 'circle', 'rounded', 'ring', 'glow', 'hexagon'].map((frame) => (
                      <button 
                        key={frame}
                        onClick={() => updateSetting("frameStyle", frame as FrameStyle)}
                        className={`py-2 text-[10px] uppercase font-bold border rounded-lg transition-all ${
                          settings.frameStyle === frame 
                          ? "border-purple-500 bg-purple-500/10 text-purple-400" 
                          : "border-slate-800 text-slate-500 hover:border-slate-600"
                        }`}
                      >
                        {frame}
                      </button>
                    ))}
                 </div>
               </div>
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-3 shrink-0 z-30 relative">
          <button 
            onClick={() => setSettings(initialSettings)}
            className="p-3 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition"
            title="Återställ"
          >
             <RotateCcw size={18} />
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-white text-black font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-slate-200 transition text-sm shadow-lg shadow-white/5"
          >
             {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save size={16}/> Spara Design</>}
          </button>
        </div>

      </div>
    </div>
  );
}

// --- MICRO COMPONENTS ---

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: LucideIcon; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-4 border-b-2 transition-all ${
        active ? "border-purple-500 text-white bg-slate-900" : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
      }`}
    >
      <Icon size={18} />
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </button>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
   return (
      <div className="space-y-2">
         <div className="flex justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
            <span className="text-[10px] font-mono text-slate-600 uppercase">{value}</span>
         </div>
         <div className="flex gap-2 items-center">
            <input 
               type="color" 
               value={value || "#000000"} 
               onChange={(e) => onChange(e.target.value)}
               className="h-10 w-10 rounded-lg cursor-pointer bg-transparent border-none p-0 overflow-hidden"
            />
            <div className="flex-1 h-10 rounded-lg border border-white/10 shadow-inner" style={{ backgroundColor: value }}></div>
         </div>
      </div>
   )
}

function SegmentedControl({ value, onChange, options }: { value: string; onChange: (v: any) => void; options: {value: string; label: string}[] }) {
  return (
    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
             value === opt.value ? "bg-slate-800 text-white shadow-sm ring-1 ring-white/5" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}