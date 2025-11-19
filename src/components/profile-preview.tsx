"use client";

import Image from "next/image";
import { getTheme, type ThemeName } from "@/utils/theme";

export type ProfilePreviewLink = {
  id: string;
  title: string;
  url: string;
  icon?: string | null;
};

interface ProfilePreviewProps {
  username: string;
  bio: string;
  profileImage?: string;
  theme: ThemeName;
  links: ProfilePreviewLink[];
}

export function ProfilePreview({
  username,
  bio,
  profileImage,
  theme,
  links,
}: ProfilePreviewProps) {
  const tokens = getTheme(theme);

  return (
    <div
      className={`relative mx-auto flex w-full max-w-sm flex-col items-center justify-start rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90 p-4 shadow-2xl ${tokens.container}`}
    >
      {/* Profilbild */}
      <div className="mt-2 flex flex-col items-center gap-3">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/20 bg-black/40">
          {profileImage ? (
            <Image
              src={profileImage}
              alt={`${username}'s profile image`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white/80">
              {username ? username.charAt(0).toUpperCase() : "?"}
            </div>
          )}
        </div>

        {/* Namn + bio */}
        <div className="text-center">
          <h2 className={`text-lg font-semibold text-white`}>
            {username || "Ditt namn"}
          </h2>
          <p className="mt-1 max-w-xs text-xs text-slate-300">
            {bio || "Skriv en kort presentation om dig själv i formuläret till vänster."}
          </p>
        </div>
      </div>

      {/* Länkar */}
      <div className="mt-5 flex w-full flex-col gap-3">
        {links.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 px-4 py-3 text-center text-[11px] text-slate-300">
            Lägg till länkar i din dashboard för att se dem här.
          </div>
        ) : (
          links.map((link) => (
            <button
              key={link.id}
              type="button"
              className={`w-full rounded-full px-4 py-2 text-sm font-medium shadow-lg transition ${tokens.link}`}
            >
              {link.title || link.url}
            </button>
          ))
        )}
      </div>

      {/* Dekorativ bottenskugga */}
      <div className="pointer-events-none absolute inset-x-6 bottom-4 h-10 rounded-full bg-gradient-to-r from-purple-500/20 via-cyan-400/20 to-purple-500/20 blur-2xl" />
    </div>
  );
}

export default ProfilePreview;
