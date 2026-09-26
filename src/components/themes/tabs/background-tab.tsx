"use client";

import { ArrowDown, ArrowRight, ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  BACKGROUND_PATTERNS,
  PATTERN_OPACITY_DEFAULT,
  PATTERN_OPACITY_MAX,
  PATTERN_OPACITY_MIN,
  type BackgroundPattern,
  type CustomThemeSettings,
} from "@/types/theme";
import { ChoiceTile, ColorPicker, PremiumBadge, SectionLabel, SegmentedControl, Slider, ToggleRow } from "@/components/themes/theme-controls";
import { getPatternBackground } from "@/lib/theme-effects";
import { MediaManager } from "@/components/themes/media-manager";
import { useT } from "@/i18n/client";

interface BackgroundTabProps {
  settings: CustomThemeSettings;
  updateSetting: (key: keyof CustomThemeSettings, value: string | number | boolean | undefined) => void;
  /** Får använda egen/Unsplash-bild (premium eller admin). */
  canUseImage: boolean;
  /** Får använda animerad gradient (premium eller admin). Saknas -> låst. */
  canAnimate?: boolean;
  onShowUpgrade: () => void;
}

function PatternSwatch({ pattern }: { pattern: BackgroundPattern }) {
  // Miniatyren visar mönstret i något starkare opacitet än standard, så att
  // det syns i 40 px — själva profilen använder reglagets värde.
  const bg = getPatternBackground(pattern, "#ffffff", 40);
  return (
    <span
      aria-hidden
      className="block h-8 w-12 rounded-lg border border-white/10 bg-slate-800"
      style={bg ? { backgroundImage: bg.backgroundImage, backgroundSize: bg.backgroundSize } : undefined}
    />
  );
}

export function BackgroundTab({ settings, updateSetting, canUseImage, canAnimate = false, onShowUpgrade }: BackgroundTabProps) {
  const t = useT();
  const pattern = settings.backgroundPattern ?? "none";

  return (
    <div className="space-y-6">
      <SegmentedControl
        ariaLabel={t("themes.tabBackground")}
        value={settings.backgroundType}
        onChange={(v) => updateSetting("backgroundType", v)}
        options={[
          { value: "solid", label: t("themes.background.typeColor") },
          { value: "gradient", label: t("themes.background.typeGradient") },
          { value: "image", label: t("themes.background.typeImage") },
        ]}
      />

      {settings.backgroundType === "solid" && (
        <ColorPicker label={t("themes.background.backgroundColor")} value={settings.backgroundColor} onChange={(v) => updateSetting("backgroundColor", v)} />
      )}

      {settings.backgroundType === "gradient" && (
        <div className="space-y-4">
          <ColorPicker label={t("themes.background.gradientFrom")} value={settings.gradientFrom} onChange={(v) => updateSetting("gradientFrom", v)} />
          <ColorPicker label={t("themes.background.gradientTo")} value={settings.gradientTo} onChange={(v) => updateSetting("gradientTo", v)} />
          <div className="space-y-2">
            <SectionLabel>{t("themes.background.direction")}</SectionLabel>
            {/* Pilknappar i stället för en dropdown: syns direkt, ett tryck, stora ytor. */}
            <SegmentedControl
              ariaLabel={t("themes.background.direction")}
              value={settings.gradientDir || "to bottom right"}
              onChange={(v) => updateSetting("gradientDir", v)}
              options={[
                { value: "to bottom", label: <ArrowDown size={18} />, ariaLabel: t("themes.background.dirDown") },
                { value: "to right", label: <ArrowRight size={18} />, ariaLabel: t("themes.background.dirRight") },
                { value: "to bottom right", label: <ArrowDownRight size={18} />, ariaLabel: t("themes.background.dirBottomRight") },
                { value: "to top right", label: <ArrowUpRight size={18} />, ariaLabel: t("themes.background.dirTopRight") },
              ]}
            />
          </div>
          <ToggleRow
            label={t("themes.background.animated")}
            description={t("themes.background.animatedDesc")}
            checked={Boolean(settings.backgroundAnimated) && canAnimate}
            onChange={(v) => updateSetting("backgroundAnimated", v)}
            locked={!canAnimate}
            onLockedClick={onShowUpgrade}
            badge={<PremiumBadge isUnlocked={canAnimate} className="relative" />}
          />
        </div>
      )}

      {settings.backgroundType === "image" && (
        <div className="space-y-5">
          <div className="space-y-2">
            <SectionLabel>{t("themes.background.chooseImage")}</SectionLabel>
            <MediaManager
              onImageSelected={(url) => updateSetting("backgroundImage", url)}
              isPremium={canUseImage}
              onShowUpgrade={onShowUpgrade}
            />
          </div>

          {settings.backgroundImage && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.backgroundImage} alt={t("themes.background.selectedAlt")} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 truncate text-sm text-slate-300">{t("themes.background.currentImage")}</div>
              </div>
              <Slider
                label={t("themes.background.blur")}
                value={settings.backgroundBlur || 0}
                min={0}
                max={20}
                unit="px"
                onChange={(v) => updateSetting("backgroundBlur", v)}
              />
              <Slider
                label={t("themes.background.overlay")}
                value={settings.backgroundOverlay || 0}
                min={0}
                max={90}
                unit="%"
                onChange={(v) => updateSetting("backgroundOverlay", v)}
              />
            </div>
          )}
        </div>
      )}

      {/* Mönster är gratis: det är en liten, statisk detalj som gör gratis-
          profiler snyggare utan att konkurrera med premiums rörelse. */}
      <div className="space-y-2.5 border-t border-white/10 pt-4">
        <SectionLabel>{t("themes.background.pattern")}</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {BACKGROUND_PATTERNS.map((p) => (
            <ChoiceTile key={p} selected={pattern === p} onClick={() => updateSetting("backgroundPattern", p)} label={t(`themes.patterns.${p}`)}>
              <PatternSwatch pattern={p} />
            </ChoiceTile>
          ))}
        </div>
        {pattern !== "none" && (
          <Slider
            label={t("themes.background.patternOpacity")}
            value={settings.backgroundPatternOpacity ?? PATTERN_OPACITY_DEFAULT}
            min={PATTERN_OPACITY_MIN}
            max={PATTERN_OPACITY_MAX}
            unit="%"
            onChange={(v) => updateSetting("backgroundPatternOpacity", v)}
          />
        )}
      </div>
    </div>
  );
}
