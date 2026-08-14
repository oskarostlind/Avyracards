"use client";

import { ProfilePreview } from "@/components/profile-preview";
import { CustomThemeSettings, defaultSettings } from "@/types/theme";
import type { MappedProfileData } from "@/lib/profile-mapper";

// Mock-data som fallback för utloggade besökare. Inloggade användare ska
// ALLTID se sin egen profil (skickas in via `data`) — att visa ett låtsaskort
// på någon annans profil i köpflödet var förvirrande (feedback aug 2026).
const DEMO_DATA: MappedProfileData = {
  mode: "SOCIAL",
  username: "demo",
  showSaveContact: true,
  displayName: "Ditt Namn",
  image: null,
  headline: "Din titel | Ditt varumärke",
  location: "Sverige",

  // Business-specifikt (kan vara null i demon)
  jobTitle: null,
  companyName: null,

  actions: [],

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

const DEMO_SETTINGS: CustomThemeSettings = {
  ...defaultSettings,
  gradientFrom: "#ec4899", // Pink-500
  gradientTo: "#8b5cf6",   // Violet-500
  backgroundType: "gradient"
};

interface LiveProfileDemoProps {
  /** Kundens riktiga profildata. Utelämnas → generisk demo. */
  data?: MappedProfileData | null;
  /** Kundens sparade temainställningar (redan mergade med defaultSettings). */
  settings?: CustomThemeSettings | null;
}

export function LiveProfileDemo({ data, settings }: LiveProfileDemoProps) {
  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
      <div className="transform scale-[0.85]">
        <ProfilePreview
          data={data || DEMO_DATA}
          customSettings={data ? (settings || defaultSettings) : DEMO_SETTINGS}
        />
      </div>
    </div>
  );
}
