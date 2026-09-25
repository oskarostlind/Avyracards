"use client";

import type { CSSProperties } from "react";
import { type CustomThemeSettings, type ButtonStyle, type ButtonVariant } from "@/types/theme";
import { ChoiceTile, ColorPicker, PremiumBadge, SectionLabel, ToggleRow } from "@/components/themes/theme-controls";
import { canAccess, PREMIUM_BUTTON_VARIANTS } from "@/lib/feature-access";
import { useT } from "@/i18n/client";

interface ButtonsTabProps {
  settings: CustomThemeSettings;
  updateSetting: (key: keyof CustomThemeSettings, value: string | boolean) => void;
  isPremium: boolean;
  isAdmin?: boolean;
  onShowUpgrade: () => void;
}

const SHAPES: ButtonStyle[] = ["rounded", "pill", "sharp", "brutal"];
const VARIANTS: ButtonVariant[] = ["solid", "outline", "soft", "glass", "ghost"];

function radius(style?: ButtonStyle): string {
  if (style === "pill") return "9999px";
  if (style === "sharp") return "0px";
  if (style === "brutal") return "3px";
  return "8px";
}

/**
 * Samma visuella logik som ProfilePreview (förenklad), så att varje ruta
 * visar hur knappen faktiskt blir — med användarens färger — i stället för
 * ett ord som "brutal" eller "ghost".
 */
function miniButtonStyle(settings: CustomThemeSettings, shape: ButtonStyle, variant: ButtonVariant): CSSProperties {
  const accent = settings.accentColor || "#8b5cf6";
  const text = settings.textColor || "#f8fafc";
  const s: CSSProperties = { borderRadius: radius(shape), color: text };

  if (variant === "outline") {
    s.border = `2px solid ${accent}`;
    s.color = accent;
  } else if (variant === "soft") {
    s.backgroundColor = accent;
    s.opacity = 0.9;
  } else if (variant === "glass") {
    s.backgroundColor = "rgba(255,255,255,0.15)";
    s.border = "1px solid rgba(255,255,255,0.25)";
  } else if (variant === "ghost") {
    s.border = "1px dashed rgba(255,255,255,0.2)";
  } else {
    s.backgroundColor = accent;
  }

  if (shape === "brutal") {
    s.border = `2px solid ${text}`;
    s.boxShadow = `3px 3px 0 0 ${text}`;
  }
  return s;
}

export function ButtonsTab({ settings, updateSetting, isPremium, isAdmin, onShowUpgrade }: ButtonsTabProps) {
  const t = useT();

  // Samma källa som /api/themes/save använder. Utan det här kunde ett gratiskonto
  // välja "glass", se den i previewn och tro att den satt — servern tvättade bort
  // den först vid spara, helt tyst. (ClickUp 86cb5duj6)
  const accessUser = { isPremium, isAdmin };
  const canUsePremiumVariants = canAccess("theme_button_glass", accessUser);

  const shape = settings.buttonStyle || "rounded";
  const variant = settings.buttonVariant || "solid";

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
            const locked = PREMIUM_BUTTON_VARIANTS.includes(v) && !canUsePremiumVariants;
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
                {PREMIUM_BUTTON_VARIANTS.includes(v) && (
                  <PremiumBadge isUnlocked={!locked} className="absolute right-1.5 top-1.5" />
                )}
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
    </div>
  );
}
