"use client";

import { User } from "lucide-react";
import {
  ANIMATED_FRAME_STYLES,
  CLASSIC_FRAME_STYLES,
  NAME_EFFECTS,
  type CustomThemeSettings,
  type FrameStyle,
  type NameEffect,
} from "@/types/theme";
import { ChoiceTile, PremiumBadge, SectionLabel, ToggleRow } from "@/components/themes/theme-controls";
import {
  canAccess,
  isFrameLocked,
  isNameEffectLocked,
  PREMIUM_FRAME_STYLES,
  PREMIUM_NAME_EFFECTS,
} from "@/lib/feature-access";
import { AvatarFrame } from "@/components/theme-effects/avatar-frame";
import { DisplayName } from "@/components/theme-effects/display-name";
import { getHeadingFontStyle } from "@/lib/theme/fonts";
import { useT } from "@/i18n/client";
import { FontPicker } from "@/components/themes/font-picker";
import { usePremiumGate } from "@/components/themes/premium-gate";

interface ProfileTabProps {
  settings: CustomThemeSettings;
  updateSetting: (key: keyof CustomThemeSettings, value: string | boolean | undefined) => void;
  /** Namnet som visas i namneffekt-miniatyrerna (användarens eget). */
  displayName?: string;
}

// Miniatyrerna ritas med samma <AvatarFrame> som profilen — de animerade
// ramarna rör sig alltså redan i väljaren (det är det som säljer dem).
const THUMB_SIZE = 40;

function FrameThumb({ frame, accent }: { frame: FrameStyle; accent: string }) {
  return (
    <AvatarFrame frame={frame} size={THUMB_SIZE} accent={accent}>
      <span className="flex h-full w-full items-center justify-center bg-slate-700 text-slate-400">
        <User size={16} />
      </span>
    </AvatarFrame>
  );
}

/** Förnamnet räcker i en miniatyr — hela namnet klipps ofta. */
function sampleName(name: string | undefined): string {
  const first = (name || "").trim().split(/\s+/)[0];
  if (!first) return "Avyra";
  return first.length > 10 ? `${first.slice(0, 9)}…` : first;
}

export function ProfileTab({ settings, updateSetting, displayName }: ProfileTabProps) {
  const t = useT();
  const { accessUser, requestPremium } = usePremiumGate();
  const canHideBranding = canAccess("theme_hide_branding", accessUser);
  const accent = settings.accentColor || "#8b5cf6";
  const sample = sampleName(displayName);
  const headingStyle = getHeadingFontStyle(settings.headingFont, settings.font);

  const renderFrameTile = (frame: FrameStyle) => {
    const locked = isFrameLocked(frame, accessUser);
    return (
      <ChoiceTile
        key={frame}
        selected={settings.frameStyle === frame}
        locked={locked}
        onClick={() => (locked ? requestPremium({ kind: "frame", frame }) : updateSetting("frameStyle", frame))}
        label={t(`themes.frames.${frame}`)}
      >
        <FrameThumb frame={frame} accent={accent} />
        {PREMIUM_FRAME_STYLES.includes(frame) && <PremiumBadge isUnlocked={!locked} className="absolute right-1.5 top-1.5" />}
      </ChoiceTile>
    );
  };

  // Namneffekter: varje ruta visar effekten LEVANDE på användarens eget namn,
  // i accentfärgen, på en liten mörk scen — samma <DisplayName> som profilen.
  const renderEffectTile = (effect: NameEffect) => {
    const locked = isNameEffectLocked(effect, accessUser);
    const selected = (settings.nameEffect ?? "none") === effect;
    return (
      <button
        key={effect}
        type="button"
        aria-pressed={selected}
        onClick={() => (locked ? requestPremium({ kind: "nameEffect", effect }) : updateSetting("nameEffect", effect))}
        className={`relative flex min-h-[92px] flex-col items-stretch gap-1.5 rounded-2xl border p-1.5 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.97] ${
          selected ? "border-purple-500 bg-purple-500/10" : "border-white/10 bg-slate-900/40 hover:border-white/25"
        }`}
      >
        <span
          className="flex h-14 items-center justify-center overflow-hidden rounded-xl px-2"
          style={{ background: `radial-gradient(90% 120% at 50% 110%, ${accent}33, transparent 70%), #0b1120` }}
        >
          <DisplayName
            as="span"
            name={sample}
            effect={effect}
            accent={accent}
            textColor={settings.textColor}
            className="max-w-full truncate text-[22px] font-bold leading-tight"
            style={{ ...headingStyle, color: settings.textColor || "#f8fafc" }}
          />
        </span>
        <span className={`px-1.5 pb-0.5 text-xs font-semibold ${selected ? "text-purple-300" : locked ? "text-nordic-highlight/80" : "text-slate-300"}`}>
          {t(`themes.nameEffects.${effect}`)}
        </span>
        {PREMIUM_NAME_EFFECTS.includes(effect) && <PremiumBadge isUnlocked={!locked} className="absolute right-2.5 top-2.5" />}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2.5" data-editor-section="font">
        <SectionLabel>{t("themes.profile.font")}</SectionLabel>
        <FontPicker font={settings.font} headingFont={settings.headingFont} onChange={updateSetting} />
      </div>

      <div className="space-y-2.5" data-editor-section="frame">
        <SectionLabel>{t("themes.profile.frame")}</SectionLabel>
        <p className="text-xs font-medium text-slate-400">{t("themes.profile.framesClassic")}</p>
        <div className="grid grid-cols-4 gap-2">
          {CLASSIC_FRAME_STYLES.map((frame) => renderFrameTile(frame))}
        </div>
        <p className="flex items-center gap-1.5 pt-1 text-xs font-medium text-amber-300">
          {t("themes.profile.framesAnimated")}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {ANIMATED_FRAME_STYLES.map((frame) => renderFrameTile(frame))}
        </div>
      </div>

      <div className="space-y-2.5" data-editor-section="nameEffect">
        <SectionLabel>{t("themes.profile.nameEffect")}</SectionLabel>
        <div className="grid grid-cols-2 gap-2">{NAME_EFFECTS.map(renderEffectTile)}</div>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-4" data-editor-section="branding">
        <ToggleRow
          label={t("themes.profile.hideBranding")}
          description={t("themes.profile.hideBrandingDesc")}
          checked={Boolean(settings.hideBranding)}
          onChange={(v) => updateSetting("hideBranding", v)}
          locked={!canHideBranding}
          onLockedClick={() => requestPremium({ kind: "hideBranding" })}
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
