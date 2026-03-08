"use client";

import { ProfilePreview } from "@/components/profile-preview";
import { defaultSettings } from "@/types/theme";
import type { MappedProfileData } from "@/lib/profile-mapper"; 

// Vi skapar mock-data som matchar den nya strukturen (MappedProfileData)
const DEMO_DATA: MappedProfileData = {
  mode: "SOCIAL",
  username: "oskar", // <-- LÄGG TILL DENNA
   showSaveContact: true, // <-- LÄGG TILL DENNA
  displayName: "Oskar Östlind",
  image: null, // Eller en URL till en demo-bild
  headline: "Grundare av AvyraCards | Digital Kreatör",
  location: "Luleå, Sverige",
  
  // Business-specifikt (kan vara null i demon)
  jobTitle: null, 
  companyName: null,
  
  actions: [], // Tom lista för demo, eller lägg till mock-actions om du vill
  
  // Vi mockar länkarna så att de ser ut som databas-objekt
  links: [
    {
      id: "demo-1",
      title: "Min Portfolio",
      url: "https://avyracards.se",
      icon: null,
      mode: "SOCIAL",
      isActive: true,
      order: 0,
      userId: "demo",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "demo-2",
      title: "Instagram",
      url: "https://instagram.com",
      icon: null,
      mode: "SOCIAL",
      isActive: true,
      order: 1,
      userId: "demo",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "demo-3",
      title: "LinkedIn",
      url: "https://linkedin.com",
      icon: null,
      mode: "SOCIAL",
      isActive: true,
      order: 2,
      userId: "demo",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

export function LiveProfileDemo() {
  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
      <div className="transform scale-[0.85]">
        <ProfilePreview 
          data={DEMO_DATA} // Vi skickar hela data-objektet nu
          customSettings={{
            ...defaultSettings,
            // Du kan anpassa demo-temat här om du vill
            gradientFrom: "#ec4899", // Pink-500
            gradientTo: "#8b5cf6",   // Violet-500
            backgroundType: "gradient"
          }}
        />
      </div>
    </div>
  );
}