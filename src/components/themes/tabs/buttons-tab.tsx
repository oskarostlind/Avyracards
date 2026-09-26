"use client";

import { useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import { type CustomThemeSettings, type ButtonStyle, type ButtonVariant } from "@/types/theme";
import { ChoiceTile, ColorPicker, PremiumBadge, SectionLabel, Slider, ToggleRow } from "@/components/themes/theme-controls";
import { isButtonVariantLocked, PREMIUM_BUTTON_VARIANTS } from "@/lib/feature-access";
import {
  BUTTON_BORDER_WIDTH_MAX,
  BUTTON_BORDER_WIDTH_MIN,
  BUTTON_STYLES,
  BUTTON_VARIANTS,
  clampButtonBorderWidth,
  getDefaultButtonBorderWidth,
  getLinkButtonAppearance,
} from "@/lib/theme/button-style";
import { normalizeHexColor } from "@/utils/color";
import { useT } from "@/i18n/client";

interface ButtonsTabProps {
  settings: CustomThemeSettings;
  updateSetting: (key: keyof CustomThemeSettings, value: string | number | boolean | undefined) => void;
  isPremium: boolean;
  isAdmin?: boolean;
  onShowUpgrade: () => void;
}

const SHAPES = BUTTON_STYLES;
const VARIANTS = BUTTON_VARIANTS;

/** Fälten under "Avancerat" — nollställs tillsammans. */
const ADVANCED_KEYS = ["buttonTextColor", "buttonBorderColor", "buttonBorderWidth", "buttonShadowColor"] as const;

/**
 * Miniatyrerna ritas med exakt samma funktion som den riktiga knappen
 * (src/lib/theme/button-style.ts), bara nerskalad — varje ruta visar hur
 * knappen faktiskt blir med användarens färger.
 */
function miniButtonStyle(settings: CustomThemeSettings, shape: ButtonStyle, variant: ButtonVariant): CSSProperties {
  return getLinkButtonAppearance({ ...settings, buttonStyle: shape, buttonVariant: variant }, { scale: 0.6 }).style;
}

/** Faktisk färg en inställning har just nu — så att väljaren visar något begripligt när fältet saknas. */
function effectiveHex(value: unknown, fallback: string): string {
  return normalizeHexColor(value) ?? normalizeHexColor(fallback) ?? "#000000";
}

export function ButtonsTab({ settings, updateSetting, isPremium, isAdmin, onShowUpgrade }: ButtonsTabProps) {
  const t = useT();
  const [advancedOpen, setAdvancedOpen] = useState(() => ADVANCED_KEYS.some((k) => settings[k] !== undefined));

  // Samma källa som /api/themes/save använder. Utan det här kunde ett gratiskonto
  // välja en premiumvariant, se den i previewn och tro att den satt — servern
  // tvättade bort den först vid spara, helt tyst. (ClickUp 86cb5duj6)
  const accessUser = { isPremium, isAdmin };

  const shape = settings.buttonStyle || "rounded";
  const variant = settings.buttonVariant || "solid";

  // Standardvärden för Avancerat, räknade ur den riktiga knappstilen.
  const defaults = getLinkButtonAppearance({
    ...settings,
    buttonTextColor: undefined,
    buttonBorderColor: undefined,
    buttonBorderWidth: undefined,
    buttonShadowColor: undefined,
  }).style;
  const borderWidth =
    clampButtonBorderWidth(settings.buttonBorderWidth) ?? getDefaultButtonBorderWidth(variant, shape);
  const hasAdvanced = ADVANCED_KEYS.some((k) => settings[k] !== undefined);

  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <SectionLabel>{t("themes.buttons.shape")}</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          {SHAPES.map((s) => (
            <ChoiceTile key={s} selected={shape === s} onClick={() => updateSetting("buttonStyle", s)} label={t(`themes.buttonShapes.${s}`)}>
              <span className="block h-5 w-full max-w-[56px]" style={miniButtonStyle(settings, s, "solid")} />
            </ChoiceTile>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <SectionLabel>{t("themes.buttons.style")}</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {VARIANTS.map((v) => {
            const isPremiumVariant = PREMIUM_BUTTON_VARIANTS.includes(v);
            const locked = isButtonVariantLocked(v, accessUser);
            return (
              <ChoiceTile
                key={v}
                selected={variant === v}
                locked={locked}
                onClick={() => (locked ? onShowUpgrade() : updateSetting("buttonVariant", v))}
                label={t(`themes.buttonVariants.${v}`)}
              >
                <span
                  className="flex h-7 w-full max-w-[84px] items-center justify-center text-[10px] font-semibold"
                  style={miniButtonStyle(settings, shape, v)}
                >
                  Aa
                </span>
                {isPremiumVariant && <PremiumBadge isUnlocked={!locked} className="absolute right-1.5 top-1.5" />}
              </ChoiceTile>
            );
          })}
        </div>
      </div>

      <ToggleRow
        label={t("themes.buttons.shadow")}
        checked={Boolean(settings.buttonShadow)}
        onChange={(v) => updateSetting("buttonShadow", v)}
      />

      <div className="space-y-2 border-t border-white/10 pt-4">
        <ColorPicker label={t("themes.buttons.accentColor")} value={settings.accentColor} onChange={(v) => updateSetting("accentColor", v)} />
        <ColorPicker label={t("themes.buttons.textColor")} value={settings.textColor} onChange={(v) => updateSetting("textColor", v)} />
      </div>

      {/* --- Avancerat: en nivå ner, så att det enkla valet förblir enkelt. --- */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40">
        <button
          type="button"
          aria-expanded={advancedOpen}
          aria-controls="buttons-advanced"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 text-left text-sm font-semibold text-nordic-secondary transition-opacity duration-100 active:opacity-70"
        >
          <span>{t("themes.buttons.advanced")}</span>
          <ChevronDown
            size={18}
            aria-hidden
            className={`text-nordic-highlight transition-transform duration-200 motion-reduce:transition-none ${advancedOpen ? "rotate-180" : ""}`}
          />
        </button>

        {advancedOpen && (
          <div id="buttons-advanced" className="space-y-2 border-t border-white/10 px-4 pb-4 pt-3">
            <p className="text-xs leading-snug text-nordic-highlight">{t("themes.buttons.advancedHint")}</p>
            <ColorPicker
              label={t("themes.buttons.buttonTextColor")}
              value={effectiveHex(settings.buttonTextColor, String(defaults.color ?? ""))}
              onChange={(v) => updateSetting("buttonTextColor", v)}
            />
            <ColorPicker
              label={t("themes.buttons.borderColor")}
              value={effectiveHex(settings.buttonBorderColor, settings.accentColor || "#8b5cf6")}
              onChange={(v) => updateSetting("buttonBorderColor", v)}
            />
            <Slider
              label={t("themes.buttons.borderWidth")}
              value={borderWidth}
              min={BUTTON_BORDER_WIDTH_MIN}
              max={BUTTON_BORDER_WIDTH_MAX}
              unit=" px"
              onChange={(v) => updateSetting("buttonBorderWidth", v)}
            />
            <ColorPicker
              label={t("themes.buttons.shadowColor")}
              value={effectiveHex(settings.buttonShadowColor, settings.accentColor || "#000000")}
              onChange={(v) => updateSetting("buttonShadowColor", v)}
            />
            {hasAdvanced && (
              <button
                type="button"
                onClick={() => ADVANCED_KEYS.forEach((k) => updateSetting(k, undefined))}
                className="mt-1 min-h-[44px] text-sm font-semibold text-purple-300 transition-opacity duration-100 active:opacity-70"
              >
                {t("themes.buttons.resetAdvanced")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
