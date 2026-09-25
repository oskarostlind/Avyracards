"use client";

import type { CSSProperties } from "react";
import { User } from "lucide-react";
import { type CustomThemeSettings, type Font, type FrameStyle } from "@/types/theme";
import { ChoiceTile, PremiumBadge, SectionLabel, ToggleRow } from "@/components/themes/theme-controls";
import { canAccess, isFrameLocked } from "@/lib/feature-access";
import { useT } from "@/i18n/client";

interface ProfileTabProps {
  settings: CustomThemeSettings;
  updateSetting: (key: keyof CustomThemeSettings, value: string | boolean) => void;
  isPremium: boolean;
  isAdmin?: boolean;
  onShowUpgrade: () => void;
}

// Samma typsnitt som ProfilePreview renderar (space = Space Grotesk).
const FONTS: { id: Font; name: string; family: string }[] = [
  { id: "inter", name: "Inter", family: "var(--font-inter), Inter, sans-serif" },
  { id: "playfair", name: "Playfair", family: "'Playfair Display', serif" },
  { id: "roboto", name: "Roboto", family: "Roboto, sans-serif" },
  { id: "space", name: "Space Grotesk", family: "'Space Grotesk', sans-serif" },
  { id: "oswald", name: "Oswald", family: "Oswald, sans-serif" },
  { id: "lora", name: "Lora", family: "Lora, serif" },
];

const FRAMES: FrameStyle[] = ["circle", "rounded", "square", "none", "ring", "glow", "hexagon", "shadow"];

function framePreviewStyle(frame: FrameStyle, accent: string): CSSProperties {
  const base: CSSProperties = { backgroundColor: "#334155" };
  switch (frame) {
    case "circle":
      return { ...base, borderRadius: "9999px" };
    case "rounded":
      return { ...base, borderRadius: "10px" };
    case "square":
      return { ...base, borderRadius: 0, border: "2px solid rgba(255,255,255,0.7)" };
    case "none":
      return { ...base, borderRadius: 0 };
    case "ring":
      return { ...base, borderRadius: "9999px", boxShadow: `0 0 0 2px #0f172a, 0 0 0 4px ${accent}` };
    case "glow":
      return { ...base, borderRadius: "9999px", boxShadow: `0 0 12px 2px ${accent}` };
    case "hexagon":
      return { ...base, clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)" };
    case "shadow":
      return { ...base, borderRadius: "9999px", boxShadow: "0 6px 12px rgba(0,0,0,0.6)" };
  }
}

export function ProfileTab({ settings, updateSetting, isPremium, isAdmin, onShowUpgrade }: ProfileTabProps) {
  const t = useT();
  const accessUser = { isPremium, isAdmin };
  const canHideBranding = canAccess("theme_hide_branding", accessUser);
  const accent = settings.accentColor || "#8b5cf6";

  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <SectionLabel>{t("themes.profile.font")}</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {FONTS.map((f) => (
            <ChoiceTile key={f.id} selected={settings.font === f.id} onClick={() => updateSetting("font", f.id)} label={f.name}>
              <span className="text-xl leading-none text-nordic-secondary" style={{ fontFamily: f.family }}>
                Aa
              </span>
            </ChoiceTile>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <SectionLabel>{t("themes.profile.frame")}</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          {FRAMES.map((frame) => {
            const locked = isFrameLocked(frame, accessUser);
            return (
              <ChoiceTile
                key={frame}
                selected={settings.frameStyle === frame}
                locked={locked}
                onClick={() => (locked ? onShowUpgrade() : updateSetting("frameStyle", frame))}
                label={t(`themes.frames.${frame}`)}
              >
                <span className="flex h-8 w-8 items-center justify-center text-slate-400" style={framePreviewStyle(frame, accent)}>
                  <User size={16} />
                </span>
                {locked && <PremiumBadge isUnlocked={false} className="absolute right-1.5 top-1.5" />}
              </ChoiceTile>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-4">
        <ToggleRow
          label={t("themes.profile.hideBranding")}
          description={t("themes.profile.hideBrandingDesc")}
          checked={Boolean(settings.hideBranding)}
          onChange={(v) => updateSetting("hideBranding", v)}
          locked={!canHideBranding}
          onLockedClick={onShowUpgrade}
          tone="emerald"
          badge={<PremiumBadge isUnlocked={canHideBranding} className="relative" />}
        />
        <ToggleRow
          label={t("themes.profile.showSaveContact")}
          description={t("themes.profile.showSaveContactDesc")}
          checked={settings.showSaveContact !== false}
          onChange={(v) => updateSetting("showSaveContact", v)}
        />
      </div>
    </div>
  );
}
