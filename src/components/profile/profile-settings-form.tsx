"use client";

import type React from "react";
import { useMemo, useState } from "react";
import type { ThemeName } from "@/utils/theme";
import { ProfilePreview } from "@/components/profile-preview";

type ProfileLink = {
  id: string;
  title: string;
  url: string;
  icon?: string | null;
};

interface ProfileSettingsFormProps {
  username: string;
  bio?: string | null;
  template?: ThemeName | null;
  fontFamily?: string | null;
  profileImage?: string | null;
  links?: ProfileLink[];
}

export function ProfileSettingsForm({
  username,
  bio: initialBio,
  template: initialTemplate,
  fontFamily: initialFontFamily,
  profileImage: initialProfileImage,
  links: initialLinks,
}: ProfileSettingsFormProps) {
  const [bio, setBio] = useState(initialBio ?? "");
  const [template, setTemplate] = useState<ThemeName>(initialTemplate ?? "default");
  const [fontFamily, setFontFamily] = useState(initialFontFamily ?? "system");
  const [profileImage, setProfileImage] = useState(initialProfileImage ?? "");
  const [links] = useState<ProfileLink[]>(initialLinks ?? []);
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

// ... allt du redan har är oförändrat ovanför

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
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setStatus(
        (data && data.error) ||
          "Något gick fel när inställningarna skulle sparas."
      );
      return;
    }

    setStatus("Inställningar sparade.");
  } catch (error) {
    console.error(error);
    setStatus("Något gick fel när inställningarna skulle sparas.");
  } finally {
    setIsSaving(false);
  }
};


  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      {/* Vänster sida – formulär */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg"
      >
        <div>
          <h1 className="text-xl font-semibold text-white">
            Profilinställningar
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Uppdatera din bio, välj tema och font. Förhandsgranskning visas till höger.
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-200">
            Kort presentation
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
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
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
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
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
          >
            <option value="system">System (standard)</option>
            <option value="serif">Serif</option>
            <option value="mono">Monospace</option>
          </select>
          <p className="text-xs text-slate-500">
            Påverkar typsnittet på din offentliga profil.
          </p>
        </div>

        {/* Profilbild – enkel URL för nu */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-200">
            Profilbild (URL)
          </label>
          <input
            type="url"
            value={profileImage}
            onChange={(e) => setProfileImage(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
            placeholder="https://exempel.se/min-bild.jpg"
          />
          <p className="text-xs text-slate-500">
            Senare kan vi koppla detta till riktig filuppladdning (Vercel Blob).
          </p>
        </div>

        {/* Spara-knapp + status */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-2xl bg-purple-500 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* Höger sida – mobilpreview */}
      <div
        className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4"
        style={fontStyle}
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
          Förhandsgranskning
        </p>
        <ProfilePreview
          username={username}
          bio={bio}
          profileImage={profileImage}
          theme={template}
          links={links}
        />
      </div>
    </div>
  );
}

export default ProfileSettingsForm;
