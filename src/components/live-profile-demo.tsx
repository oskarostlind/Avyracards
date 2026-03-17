"use client";

import { ProfilePreview } from "@/components/profile-preview";
import { defaultSettings } from "@/types/theme";
import type { MappedProfileData } from "@/lib/profile-mapper"; 

// Generisk demo-data (inga personuppgifter) – matchar premium-profilkortets utseende
const DEMO_DATA: MappedProfileData = {
  mode: "SOCIAL",
  username: "demo",
  showSaveContact: true,
  displayName: "Ditt namn",
  image: null,
  headline: "Din titel eller tagline visas här",
  location: "Stockholm, Sverige",
  jobTitle: null,
  companyName: null,
  actions: [],
  links: [
    {
      id: "demo-1",
      title: "Min Portfolio",
      url: "https://example.com",
      icon: null,
      mode: "SOCIAL",
      isActive: true,
      order: 0,
      userId: "demo",
      createdAt: new Date(),
      updatedAt: new Date(),
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
      updatedAt: new Date(),
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
      updatedAt: new Date(),
    },
  ],
};

export function LiveProfileDemo() {
  return (
    <div className="w-full min-h-[320px] flex items-center justify-center pointer-events-none select-none py-6">
      <div className="transform scale-[0.92] origin-center">
        <ProfilePreview
          data={DEMO_DATA}
          customSettings={{
            ...defaultSettings,
            backgroundType: "gradient",
            gradientFrom: "#5b21b6",
            gradientTo: "#db2777",
            gradientDir: "to bottom",
            accentColor: "#7c3aed",
            textColor: "#ffffff",
            buttonStyle: "rounded",
            buttonVariant: "solid",
          }}
        />
      </div>
    </div>
  );
}