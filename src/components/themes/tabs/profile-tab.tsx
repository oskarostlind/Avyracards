"use client";

import { User } from "lucide-react";
import {
  ANIMATED_FRAME_STYLES,
  CLASSIC_FRAME_STYLES,
  NAME_EFFECTS,
  type CustomThemeSettings,
  type FrameStyle,
} from "@/types/theme";
import { ChoiceTile, PremiumBadge, SectionLabel, ToggleRow } from "@/components/themes/theme-controls";
import { canAccess, isFrameLocked, isNameEffectLocked } from "@/lib/feature-access";
import { AvatarFrame } from "@/components/theme-effects/avatar-frame";
import { DisplayName } from "@/components/theme-effects/display-name";
import { useT } from "@/i18n/client";
import { FontPicker } from "@/components/themes/font-picker";

interface ProfileTabProps {
  settings: CustomThemeSettings;
  updateSetting: (key: keyof CustomThemeSettings, value: string | boolean | undefined) => void;
  isPremium: boolean;
  isAdmin?: boolean;
  onShowUpgrade: () => void;
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

export function ProfileTab({ settings, updateSetting, isPremium, isAdmin, onShowUpgrade }: ProfileTabProps) {
  const t = useT();
  const accessUser = { isPremium, isAdmin };
  const canHideBranding = canAccess("theme_hide_branding", accessUser);
  const accent = settings.accentColor || "#8b5cf6";

  const renderFrameTile = (frame: FrameStyle) => {
    const locked = isFrameLocked(frame, accessUser);
    return (
      <ChoiceTile
        key={frame}
        selected={settings.frameStyle === frame}
        locked={locked}
        onClick={() => (locked ? onShowUpgrade() : updateSetting("frameStyle", frame))}
        label={t(`themes.frames.${frame}`)}
      >
        <FrameThumb frame={frame} accent={accent} />
        {locked && <PremiumBadge isUnlocked={false} className="absolute right-1.5 top-1.5" />}
      </ChoiceTile>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <SectionLabel>{t("themes.profile.font")}</SectionLabel>
        <FontPicker
          font={settings.font}
          headingFont={settings.headingFont}
          onChange={updateSetting}
          accessUser={accessUser}
          onShowUpgrade={onShowUpgrade}
        />
      </div>

      <div className="space-y-2.5">
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

      <div className="space-y-2.5">
        <SectionLabel>{t("themes.profile.nameEffect")}</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {NAME_EFFECTS.map((effect) => {
            const locked = isNameEffectLocked(effect, accessUser);
            return (
              <ChoiceTile
                key={effect}
                selected={(settings.nameEffect ?? "none") === effect}
                locked={locked}
                onClick={() => (locked ? onShowUpgrade() : updateSetting("nameEffect", effect))}
                label={t(`themes.nameEffects.${effect}`)}
              >
                <DisplayName
                  as="span"
                  name="Aa Bb"
                  effect={effect}
                  accent={accent}
                  textColor={settings.textColor}
                  className="text-lg font-bold leading-none text-slate-100"
                />
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
