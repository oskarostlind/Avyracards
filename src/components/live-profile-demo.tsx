"use client";

import { ProfilePreview, type PreviewLink } from "@/components/profile-preview";
import { defaultSettings } from "@/types/theme"; // Vi importerar default-inställningarna

const MOCK_LINKS: PreviewLink[] = [
  { 
    id: "1", 
    title: "Instagram", 
    url: "https://instagram.com", 
    icon: "instagram" 
  },
  { 
    id: "2", 
    title: "Min Hemsida", 
    url: "https://example.com", 
    icon: "globe" 
  },
  { 
    id: "3", 
    title: "Boka tid", 
    url: "https://calendly.com", 
    icon: "calendar" 
  },
];

export function LiveProfileDemo() {
  return (
    <div className="w-full h-full flex justify-center items-center bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-800 relative">
      {/* Skala ner previewen lite så den får plats snyggt i demorutan */}
      <div className="transform scale-[0.65] sm:scale-[0.8] origin-center h-[750px] w-[375px] pointer-events-none select-none border-[8px] border-slate-800 rounded-[3rem] overflow-hidden bg-black shadow-2xl">
        <ProfilePreview 
          username="Anna Andersson"
          name="Anna Andersson"
          bio="Digital Creator & Designer. Hjälper företag att synas online."
          avatarUrl={null} // Eller en URL till en demobild om du har
          links={MOCK_LINKS}
          // HÄR ÄR FIXEN: Vi skickar in defaultSettings istället för 'theme="default"'
          customSettings={defaultSettings}
          // Vi tar bort 'profileMode' eftersom nya komponenten inte använder det propet längre
        />
      </div>
      
      {/* En overlay som gör att man inte kan klicka på länkarna i demot (valfritt) */}
      <div className="absolute inset-0 z-20"></div>
    </div>
  );
}