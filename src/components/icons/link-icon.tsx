import React from "react";

import { iconMap, type IconKey } from "@/components/icons/social-icons";
import { getLinkIcon, resolveLinkIconSlug, type LinkIconDef } from "@/lib/link-icons";

/**
 * Ritar ikonen för en länkknapp.
 *
 * Varumärkesikoner ritas som fylld SVG-path (Simple Icons), generiska ikoner
 * med lucide — samma `iconMap` som resten av appen. Båda använder
 * `currentColor`, så ikonen ärver knappens textfärg och funkar därmed med alla
 * teman och med per-länk-färger.
 */

interface LinkIconProps {
  /** Länkens URL — används för auto-detektering. */
  url?: string | null;
  /** Länkens titel — sekundär ledtråd vid auto-detektering. */
  title?: string | null;
  /** Manuellt vald slug. null/undefined = automatisk. */
  icon?: string | null;
  size?: number;
  className?: string;
}

export function LinkIcon({ url, title, icon, size = 20, className }: LinkIconProps) {
  const def = getLinkIcon(resolveLinkIconSlug({ url, title, icon }));
  return <LinkIconGlyph def={def} size={size} className={className} />;
}

/** Ritar en ikon som redan är upplöst — används av ikonväljaren. */
export function LinkIconGlyph({
  def,
  size = 20,
  className,
}: {
  def: LinkIconDef;
  size?: number;
  className?: string;
}) {
  if (def.path) {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
      >
        <path d={def.path} />
      </svg>
    );
  }

  const Fallback = iconMap[(def.lucide as IconKey) ?? "default"] ?? iconMap.default;
  return <Fallback size={size} className={className} aria-hidden="true" />;
}
