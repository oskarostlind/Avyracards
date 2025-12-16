"use client";

import type React from "react";
import { useMemo, useState } from "react";
import type { ThemeName } from "@/utils/theme";
import { ProfilePreview, type PreviewLink } from "@/components/profile-preview"; // Importera PreviewLink
import { defaultSettings } from "@/types/theme"; // Importera default settings

type ProfileLink = {
  id: string;
  title: string;
  url: string;
  icon?: string | null;
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
  
  // Konvertera links till rätt format för PreviewLink om det behövs
  // Här antar vi att strukturen är kompatibel eller gör en enkel map
  const [links] = useState<PreviewLink[]>(
    (initialLinks ?? []).map(l => ({ ...l, icon: l.icon || undefined })) 
  );
  
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
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur">
        <div className="mb-4 space-y-1">
          <h1 className="text-lg font-semibold text-slate-50">Profilinställningar</h1>
          <p className="text-xs text-slate-400">
            Uppdatera hur din offentliga SocialCard-profil ser ut.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" style={fontStyle}>
          {/* Profil-läge */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Profil-läge
            </label>
            <p className="text-xs text-slate-500 mb-1">
              Välj om din offentliga profil ska fokusera på sociala medier eller
              professionell närvaro.
            </p>
            <div className="inline-flex rounded-2xl border border-slate-700 bg-slate-950/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setProfileMode("SOCIAL")}
                className={`flex-1 rounded-2xl px-3 py-1.5 font-medium transition ${
                  profileMode === "SOCIAL"
                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/40"
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
                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/40"
                    : "text-slate-300 hover:bg-slate-900/80"
                }`}
              >
                Business profil
              </button>
            </div>
            <p className="text-xs text-slate-500">
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
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="Skriv en kort text om dig själv..."
            />
            <p className="text-xs text-slate-500">
              Detta visas överst på din offentliga SocialCard-sida.
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
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
            >
              <option value="default">Default</option>
              <option value="elegant">Elegant</option>
              <option value="dark">Dark</option>
              <option value="neon">Neon</option>
              <option value="sun">Sun</option>
              <option value="graffiti">Graffiti</option>
              <option value="rainbow">Rainbow</option>
            </select>
            <p className="text-xs text-slate-500">
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
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
            >
              <option value="system">System (standard)</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
            </select>
            <p className="text-xs text-slate-500">
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
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="https://exempel.se/min-bild.jpg"
            />
            <p className="text-xs text-slate-500">
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
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="+46 70 123 45 67"
            />
            <p className="text-xs text-slate-500">
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
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="namn@företag.se"
            />
            <p className="text-xs text-slate-500">
              Den här adressen kan du visa utåt i stället för din inloggningsmail.
            </p>
          </div>

          {/* Spara-knapp + status */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-2xl bg-purple-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-purple-500/30 transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Sparar..." : "Spara ändringar"}
            </button>
            {status && (
              <p className="text-xs text-slate-400">
                {status}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Preview */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 shadow-xl shadow-black/40 backdrop-blur">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
          Förhandsgranskning
        </p>
        <div className="flex justify-center">
          <div className="transform scale-[0.8] origin-top">
            <ProfilePreview
              username={username}
              name={username} // Eller använd display name om det finns
              bio={bio}
              avatarUrl={profileImage}
              links={links}
              // Använder defaultSettings här eftersom detta är en "innehålls-editor" 
              // och inte "design-editor". Designen ställs in på en annan sida.
              customSettings={defaultSettings} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSettingsForm;