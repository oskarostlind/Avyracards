"use client";

import { ProfilePreview } from "@/components/profile-preview";

export function LiveProfileDemo() {
  // Låtsas-data för förhandsvisningen
  const mockLinks = [
    { id: "1", title: "Min Portfolio", url: "#", icon: null },
    { id: "2", title: "Instagram", url: "#", icon: null },
    { id: "3", title: "Boka möte", url: "#", icon: null },
    { id: "4", title: "Kontakta mig", url: "#", icon: null },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Glow effekt bakom */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-[40px] blur-xl" />
      
      {/* Din befintliga komponent */}
      <div className="relative transform transition-transform hover:scale-[1.02] duration-500">
        <ProfilePreview 
          username="Anna Andersson"
          bio="Digital Creator & Designer. Hjälper företag att synas online."
          theme="default" // Eller "simple", beroende på vad du har för teman i din theme.ts
          links={mockLinks}
          profileMode="SOCIAL"
          // Om du inte har en bild URL just nu, kommer den visa initialer vilket är helt ok
          profileImage="" 
        />
        
        {/* Flytande "Verified" badge ovanpå för extra säljeffekt */}
        <div className="absolute -right-2 top-6 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-[#030712] animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
          VERIFIERAD
        </div>
      </div>
    </div>
  );
}