import type { CSSProperties, ElementType } from "react";
import { NAME_EFFECTS, type NameEffect } from "@/types/theme";
import { mixHex, safeAccent } from "@/lib/theme-effects";
import fx from "./theme-effects.module.css";

/**
 * Visningsnamnet med vald namneffekt (premium).
 *
 * - gradient : accent-gradient i texten (statisk)
 * - glow     : mjuk accentglöd bakom texten som andas (opacitet)
 * - shimmer  : ljusstrimma som sveper över texten (transform)
 *
 * Reducerad rörelse: glöden står still, svepet döljs — gradient/text ser
 * fortfarande färdiga ut. Dekorativa kopior är aria-hidden så skärmläsare
 * bara läser namnet en gång.
 */
export function DisplayName({
  name,
  effect = "none",
  accent,
  textColor,
  as: Tag = "h1",
  className = "",
  style,
}: {
  name: string;
  effect?: NameEffect;
  accent?: string | null;
  textColor?: string | null;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  // Okänt värde (gammal/manipulerad data) renderas som vanlig text.
  if (!effect || effect === "none" || !(NAME_EFFECTS as readonly string[]).includes(effect)) {
    return (
      <Tag className={className} style={style}>
        {name}
      </Tag>
    );
  }

  const a = safeAccent(accent);
  const text = safeAccent(textColor ?? "#f8fafc");
  const vars = {
    "--ne-a": a,
    "--ne-b": mixHex(a, "#ffffff", 0.6),
    "--ne-c": mixHex(a, text, 0.35),
    "--ne-sheen": mixHex(a, "#ffffff", 0.85),
  } as CSSProperties;

  if (effect === "gradient") {
    return (
      <Tag className={className} style={style}>
        <span className={`${fx.nameRoot} ${fx.nameGradient}`} style={vars}>
          {name}
        </span>
      </Tag>
    );
  }

  if (effect === "glow") {
    return (
      <Tag className={className} style={style}>
        <span className={fx.nameRoot} style={vars}>
          <span aria-hidden className={fx.nameGlowCopy}>
            {name}
          </span>
          {name}
        </span>
      </Tag>
    );
  }

  // shimmer — nameClip så att det glidande fönstret aldrig ger horisontell scroll.
  return (
    <Tag className={className} style={style}>
      <span className={`${fx.nameRoot} ${fx.nameClip}`} style={vars}>
        {name}
        <span aria-hidden className={fx.nameSweep}>
          <span className={fx.nameSweepText}>{name}</span>
        </span>
      </span>
    </Tag>
  );
}
