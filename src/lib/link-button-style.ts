import type { CSSProperties } from "react";

import type { ButtonVariant } from "@/types/theme";
import { getReadableTextColor, hexToRgba, normalizeHexColor } from "@/utils/color";

/**
 * Lägger en per-länk-färg ovanpå den knappstil temat redan räknat ut.
 *
 * Färgen ska bete sig som temats accentfärg gör för just den knappstilen —
 * annars ser en egen färg olika ut beroende på om profilen kör SOLID eller
 * OUTLINE, och användaren tror att inställningen är trasig. Därför grenar vi
 * på samma varianter som getLinkStyle/getButtonStyle i profilkomponenterna.
 *
 * Textfärgen sätts från en luminansberäkning (WCAG) så att t.ex. Snapchat-gult
 * får svart text i stället för vit.
 */
export function applyCustomLinkColor(
  base: CSSProperties,
  customColor: string | null | undefined,
  variant?: ButtonVariant,
  fallbackTextColor?: string,
): CSSProperties {
  const color = normalizeHexColor(customColor);
  if (!color) return base;

  const style: CSSProperties = { ...base };

  switch (variant) {
    case "outline":
      style.backgroundColor = "transparent";
      style.border = `2px solid ${color}`;
      style.color = color;
      break;

    case "ghost":
      style.backgroundColor = "transparent";
      style.border = "1px solid transparent";
      style.color = color;
      break;

    case "glass":
      // Glas ligger ovanpå bakgrunden — vi tonar glaset i färgen i stället för
      // att fylla knappen, och rör inte textfärgen som temat satt.
      style.backgroundColor = hexToRgba(color, 0.18);
      style.border = `1px solid ${hexToRgba(color, 0.45)}`;
      style.backdropFilter = "blur(10px)";
      if (fallbackTextColor) style.color = fallbackTextColor;
      break;

    case "shadow":
      style.backgroundColor = color;
      style.color = getReadableTextColor(color);
      style.boxShadow = `0 10px 15px -3px ${hexToRgba(color, 0.25)}`;
      break;

    case "soft":
      style.backgroundColor = color;
      style.color = getReadableTextColor(color);
      style.opacity = 0.9;
      break;

    // "solid" och odefinierad variant (klassiska teman utan CustomThemeSettings)
    default:
      style.backgroundColor = color;
      style.color = getReadableTextColor(color);
      break;
  }

  return style;
}
