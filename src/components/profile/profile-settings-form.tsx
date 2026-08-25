"use client";

import type React from "react";
import { useMemo, useState } from "react";
import type { ThemeName } from "@/utils/theme";
import { ProfilePreview } from "@/components/profile-preview";
import { defaultSettings } from "@/types/theme";
import { getProfileData } from "@/lib/profile-mapper"; // <--- 1. Importera mappern

// Typen för länkar som kommer in via props
type ProfileLink = {
  id: string;
  title: string;
  url: string;
  icon?: string | null;
  customColor?: string | null;
  mode?: string | null; // Kan finnas, annars defaultar vi
};

type ProfileMode = "SOCIAL" | "BUSINESS";

interface ProfileSettingsFormProps {
  username: string;
  bio?: string | null;
  template?: ThemeName | null;
  fontFamily?: string | null;
  profileImage?: string | null;
  phoneNumber?: string | null;
  contactEmail?: string | null;
  profileMode?: ProfileMode | null;
  links?: ProfileLink[];
}

export function ProfileSettingsForm({
  username,
  bio: initialBio,
  template: initialTemplate,
  fontFamily: initialFontFamily,
  profileImage: initialProfileImage,
  phoneNumber: initialPhoneNumber,
  contactEmail: initialContactEmail,
  profileMode: initialProfileMode,
  links: initialLinks,
}: ProfileSettingsFormProps) {
  const [bio, setBio] = useState(initialBio ?? "");
  const [template, setTemplate] = useState<ThemeName>(initialTemplate ?? "default");
  const [fontFamily, setFontFamily] = useState(initialFontFamily ?? "system");
  const [profileImage, setProfileImage] = useState(initialProfileImage ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber ?? "");
  const [contactEmail, setContactEmail] = useState(initialContactEmail ?? "");
  
  const [profileMode, setProfileMode] = useState<ProfileMode>(
    initialProfileMode ?? "SOCIAL"
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const fontStyle = useMemo<React.CSSProperties>(() => {
    switch (fontFamily) {
      case "serif":
        return { fontFamily: "Georgia, 'Times New Roman', serif" };
      case "mono":
        return { fontFamily: "'JetBrains Mono', Menlo, monospace" };
      default:
        return {};
    }
  }, [fontFamily]);

  // --- 2. SKAPA LIVE-DATA FÖR PREVIEW ---
  // Vi bygger ett objekt som liknar det databasen returnerar
  const previewUser = {
    username,
    name: username, // Fallback för namn
    bio,
    avatarUrl: profileImage,
    businessAvatarUrl: null, // Detta formulär redigerar inte business-bilden än
    phoneNumber,
    contactEmail,
    
    // Business-fält (Sätts till null då detta formulär inte redigerar dem)
    jobTitle: null,
    companyName: null,
    location: null,
    businessHeadline: null,
    businessEmail: null,
    businessPhone: null,
    companyWebsite: null,
    bookingUrl: null,

    // Mappa länkarna till rätt struktur för mappern
    links: (initialLinks ?? []).map(l => ({
        id: l.id,
        title: l.title,
        url: l.url,
        icon: l.icon || null,
        customColor: l.customColor || null,
        mode: l.mode || "SOCIAL", // Default till SOCIAL om det saknas
        isActive: true,
        order: 0,
        userId: "preview",
        createdAt: new Date(),
        updatedAt: new Date()
    }))
  };

  // --- 3. MAPPA DATAN ---
  // Detta genererar rätt struktur för ProfilePreview
  const mappedData = getProfileData(previewUser, profileMode);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          theme: template,
          font: fontFamily,
          avatarUrl: profileImage || null,
          phoneNumber: phoneNumber || null,
          contactEmail: contactEmail || null,
          profileMode,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setStatus(
          data?.error ??
            "Något gick fel när profilen skulle sparas. Försök igen strax."
        );
        return;
      }

      setStatus("✅ Profilen är uppdaterad!");
    } catch (error) {
      console.error(error);
      setStatus("⚠ Ett oväntat fel uppstod. Kontrollera din uppkoppling.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      {/* Formulär */}
      <div className="rounded-3xl border border-nordic-highlight/40 bg-nordic-primary/70 p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur">
        <div className="mb-4 space-y-1">
          <h1 className="text-lg font-semibold text-nordic-secondary">Profilinställningar</h1>
          <p className="text-xs text-nordic-highlight">
            Uppdatera hur din offentliga AvyraCards-profil ser ut.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" style={fontStyle}>
          {/* Profil-läge */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Profil-läge
            </label>
            <p className="text-xs text-nordic-highlight mb-1">
              Välj om din offentliga profil ska fokusera på sociala medier eller
              professionell närvaro.
            </p>
            <div className="inline-flex rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setProfileMode("SOCIAL")}
                className={`flex-1 rounded-2xl px-3 py-1.5 font-medium transition ${
                  profileMode === "SOCIAL"
                    ? "bg-purple-500 text-nordic-secondary shadow-md shadow-purple-500/40"
                    : "text-slate-300 hover:bg-slate-900/80"
                }`}
              >
                Social profil
              </button>
              <button
                type="button"
                onClick={() => setProfileMode("BUSINESS")}
                className={`flex-1 rounded-2xl px-3 py-1.5 font-medium transition ${
                  profileMode === "BUSINESS"
                    ? "bg-purple-500 text-nordic-secondary shadow-md shadow-purple-500/40"
                    : "text-slate-300 hover:bg-slate-900/80"
                }`}
              >
                Business profil
              </button>
            </div>
            <p className="text-xs text-nordic-highlight">
              {profileMode === "SOCIAL"
                ? "Fokus på länkar, sociala medier och kreatörsprofil."
                : "Fokus på titel, kontaktuppgifter och ett mer professionellt visitkorts-upplägg."}
            </p>
          </div>

          {/* Kort presentation */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Kort presentation
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-sm text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="Skriv en kort text om dig själv..."
            />
            <p className="text-xs text-nordic-highlight">
              Detta visas överst på din offentliga AvyraCards-sida.
            </p>
          </div>

          {/* Tema */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Tema
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as ThemeName)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-sm text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
            >
              <option value="default">Default</option>
              <option value="elegant">Elegant</option>
              <option value="dark">Dark</option>
              <option value="neon">Neon</option>
              <option value="sun">Sun</option>
              <option value="graffiti">Graffiti</option>
              <option value="rainbow">Rainbow</option>
            </select>
            <p className="text-xs text-nordic-highlight">
              Byt utseende på din offentliga sida med olika teman.
            </p>
          </div>

          {/* Font */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Font
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-sm text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
            >
              <option value="system">System (standard)</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
            </select>
            <p className="text-xs text-nordic-highlight">
              Påverkar typsnittet på din offentliga profil.
            </p>
          </div>

          {/* Profilbild (URL) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Profilbild (URL)
            </label>
            <input
              type="url"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-sm text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="https://exempel.se/min-bild.jpg"
            />
            <p className="text-xs text-nordic-highlight">
              Bilden används både i förhandsvisningen och på den offentliga sidan.
            </p>
          </div>

          {/* Telefonnummer */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Telefonnummer
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-sm text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="+46 70 123 45 67"
            />
            <p className="text-xs text-nordic-highlight">
              Visas som kontaktuppgift (t.ex. på din offentliga profil).
            </p>
          </div>

          {/* Kontaktmail */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Kontakt-e-post
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-sm text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="namn@företag.se"
            />
            <p className="text-xs text-nordic-highlight">
              Den här adressen kan du visa utåt i stället för din inloggningsmail.
            </p>
          </div>

          {/* Spara-knapp + status */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-2xl bg-purple-500 px-4 py-2 text-sm font-medium text-nordic-secondary shadow-md shadow-purple-500/30 transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Sparar..." : "Spara ändringar"}
            </button>
            {status && (
              <p className="text-xs text-nordic-highlight">
                {status}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Preview */}
      <div className="rounded-3xl border border-nordic-highlight/40 bg-nordic-primary/60 p-4 sm:p-5 shadow-xl shadow-black/40 backdrop-blur">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-nordic-highlight">
          Förhandsgranskning
        </p>
        <div className="flex justify-center">
          <div className="transform scale-[0.8] origin-top">
            {/* 4. Skicka in Mapped Data */}
            <ProfilePreview
              data={mappedData}
              // Vi låter fonten uppdateras live i previewn
              customSettings={{ 
                ...defaultSettings, 
                // @ts-ignore - enkel hack för att visa fonten live om du inte har strikta typer för alla fonter
                font: fontFamily 
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSettingsForm;