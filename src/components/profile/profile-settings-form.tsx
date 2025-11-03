"use client";

import { useCallback, useMemo, useState } from "react";

import { FileUploadButton } from "@/components/file-upload-button";
import { ProfilePreview } from "@/components/profile-preview";
import { ThemeSelector } from "@/components/theme-selector";
import { LinkItem } from "@/components/links-list";
import type { ThemeName } from "@/utils/theme";

interface ProfileSettingsFormProps {
  username: string;
  bio?: string | null;
  template?: ThemeName | null;
  fontFamily?: string | null;
  profileImage?: string | null;
  links: LinkItem[];
}

const fontMap: Record<string, string> = {
  inter: "'Inter', sans-serif",
  segoe: "'Segoe UI', sans-serif",
  roboto: "'Roboto', sans-serif",
  georgia: "'Georgia', serif",
};

export function ProfileSettingsForm({ username, bio, template, fontFamily, profileImage, links }: ProfileSettingsFormProps) {
  const [currentBio, setCurrentBio] = useState(bio ?? "");
  const [currentTemplate, setCurrentTemplate] = useState<ThemeName>((template as ThemeName) ?? "default");
  const [currentFont, setCurrentFont] = useState(fontFamily ?? "inter");
  const [currentImage, setCurrentImage] = useState(profileImage ?? undefined);
  const [status, setStatus] = useState<string | null>(null);

  const fontStyle = useMemo(() => ({ fontFamily: fontMap[currentFont] ?? fontMap.inter }), [currentFont]);

  const saveSettings = useCallback(async () => {
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio: currentBio,
        template: currentTemplate,
        fontFamily: currentFont,
        profileImage: currentImage,
      }),
    });
    if (response.ok) {
      setStatus("Sparat!");
    } else {
      const data = await response.json();
      setStatus(data.error ?? "Kunde inte spara");
    }
  }, [currentBio, currentTemplate, currentFont, currentImage]);

  const handleUpload = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload/profile-image", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        setStatus("Kunde inte ladda upp bild");
        return;
      }
      const data = (await response.json()) as { user: { profileImage: string | null } };
      setCurrentImage(data.user.profileImage ?? undefined);
    },
    []
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void saveSettings();
        }}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700" htmlFor="bio">
            Kort bio
          </label>
          <textarea
            id="bio"
            value={currentBio}
            onChange={(event) => setCurrentBio(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <ThemeSelector value={currentTemplate} onChange={(value) => setCurrentTemplate(value)} label="Välj tema" />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700" htmlFor="fontFamily">
            Typsnitt
          </label>
          <select
            id="fontFamily"
            value={currentFont}
            onChange={(event) => setCurrentFont(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="inter">Inter</option>
            <option value="segoe">Segoe UI</option>
            <option value="roboto">Roboto</option>
            <option value="georgia">Georgia</option>
          </select>
        </div>
        <FileUploadButton label="Byt profilbild" onUpload={handleUpload} />
        <button type="submit" className="rounded-full bg-slate-900 px-6 py-2 text-white hover:bg-slate-700">
          Spara ändringar
        </button>
        {status && <p className="text-sm text-slate-500">{status}</p>}
      </form>
      <aside className="mobile-frame" style={fontStyle}>
        <ProfilePreview
          username={username}
          bio={currentBio}
          profileImage={currentImage}
          theme={currentTemplate}
          links={links}
        />
      </aside>
    </div>
  );
}
