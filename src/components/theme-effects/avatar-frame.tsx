import type { CSSProperties, ReactNode } from "react";
import type { AnimatedFrameStyle, FrameStyle } from "@/types/theme";
import { isAnimatedFrame, mixHex, safeAccent } from "@/lib/theme-effects";
import fx from "./theme-effects.module.css";

/**
 * Profilbild + ram. Används av publik social-/business-profil, editorns
 * live-preview och ram-miniatyrerna i temaeditorn — en implementation, så att
 * miniatyren visar exakt det besökaren ser.
 *
 * Allt skalas från `size` (px): ringtjocklek, glöd och skuggor är proportionella,
 * så samma ram fungerar i 32 px (miniatyr) och 112 px (profil).
 *
 * Animerade ramar (premium) animerar bara transform/opacity och har en
 * animation var (rotation 8–11 s, pulser/svep ~3 s) — se theme-effects.module.css för reglerna.
 */

export interface AvatarFrameProps {
  frame: FrameStyle | undefined;
  /** Px. Ytterkant för ramen; glöd/aura får rita utanför. */
  size: number;
  accent?: string | null;
  /** Innehållet i bildytan: <Image fill>, <img> eller en fallback. */
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const HEXAGON = "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)";

type Vars = CSSProperties & Record<`--${string}`, string>;

function px(n: number) {
  return `${Math.round(n * 100) / 100}px`;
}

export function AvatarFrame({ frame = "circle", size, accent, children, className = "", style }: AvatarFrameProps) {
  const a = safeAccent(accent);
  const k = size / 112;
  const outer: CSSProperties = { width: size, height: size, ...style };

  if (isAnimatedFrame(frame)) {
    return (
      <AnimatedFrame frame={frame} size={size} accent={a} className={className} style={outer}>
        {children}
      </AnimatedFrame>
    );
  }

  // --- Klassiska ramar (gratis) ---
  const border = Math.max(1, Math.round(size * 0.03));
  const clip: CSSProperties = { inset: 0, borderRadius: "9999px" };
  let ring: ReactNode = null;

  switch (frame) {
    case "rounded":
      clip.borderRadius = "22%";
      clip.border = `${border}px solid rgba(255,255,255,0.1)`;
      break;
    case "square":
      clip.borderRadius = 0;
      clip.border = `${border}px solid ${a}`;
      break;
    case "none":
      clip.borderRadius = 0;
      break;
    case "hexagon":
      clip.borderRadius = 0;
      clip.clipPath = HEXAGON;
      break;
    case "ring": {
      const t = Math.max(2, Math.round(size * 0.035));
      const gap = Math.max(1, Math.round(size * 0.035));
      ring = <span aria-hidden className={fx.layer} style={{ border: `${t}px solid ${a}` }} />;
      clip.inset = t + gap;
      break;
    }
    case "glow":
      clip.border = `${border}px solid rgba(255,255,255,0.1)`;
      clip.boxShadow = `0 0 ${px(28 * k)} ${a}`;
      break;
    case "shadow":
      clip.border = `${border}px solid rgba(255,255,255,0.1)`;
      clip.boxShadow = `${px(7 * k)} ${px(7 * k)} 0 ${a}`;
      break;
    case "circle":
    default:
      clip.border = `${border}px solid rgba(255,255,255,0.1)`;
      break;
  }

  return (
    <div className={`${fx.frame} ${className}`} style={outer} data-frame={frame}>
      {ring}
      <div className={fx.clip} style={clip}>
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function AnimatedFrame({
  frame,
  size,
  accent,
  className,
  style,
  children,
}: {
  frame: AnimatedFrameStyle;
  size: number;
  accent: string;
  className: string;
  style: CSSProperties;
  children: ReactNode;
}) {
  const t = Math.max(2, size * 0.048); // ringtjocklek
  const gap = Math.max(1, size * 0.028);
  let imageInset = t + gap;

  const vars: Vars = {
    ...style,
    "--af-accent": accent,
    "--af-accent-light": mixHex(accent, "#ffffff", 0.55),
    "--af-t": px(t),
    "--af-rw": px(t),
    "--af-blur": px(Math.max(1.5, t * 1.1)),
    "--af-spark": px(Math.max(2.5, t * 0.95)),
  };

  const ring = (fill: string, extra = "") => <span className={`${fx.layer} ${fill} ${fx.ringMask} ${extra}`} />;

  let layers: ReactNode = null;
  let overImage: ReactNode = null;

  switch (frame) {
    case "aurora":
      layers = (
        <span className={`${fx.layer} ${fx.spin}`} style={{ "--af-period": "9s" } as Vars}>
          <span className={`${fx.layer} ${fx.soft}`}>{ring(fx.auroraFill)}</span>
          {ring(fx.auroraFill)}
        </span>
      );
      break;

    case "pulse":
      layers = (
        <>
          <span className={`${fx.layer} ${fx.aura}`} />
          {ring(fx.solidFill)}
        </>
      );
      break;

    case "holo":
      layers = (
        <span className={`${fx.layer} ${fx.spin}`} style={{ "--af-period": "10s" } as Vars}>
          <span className={`${fx.layer} ${fx.soft}`}>{ring(fx.holoFill)}</span>
          {ring(fx.holoFill)}
        </span>
      );
      overImage = <span aria-hidden className={`${fx.layer} ${fx.gloss}`} />;
      break;

    case "orbit":
      layers = (
        <>
          <span className={`${fx.layer} ${fx.thinFill} ${fx.ringMask}`} style={{ "--af-rw": px(Math.max(1, t * 0.4)) } as Vars} />
          <span className={`${fx.layer} ${fx.spin}`} style={{ "--af-period": "8s" } as Vars}>
            {ring(fx.tailFill)}
            <span className={fx.sparkArm}>
              <span className={fx.spark} />
            </span>
            <span className={fx.sparkArm} style={{ transform: "rotate(180deg)" }}>
              <span className={fx.spark} style={{ transform: "translate(-50%, -50%) scale(0.6)" }} />
            </span>
          </span>
        </>
      );
      break;

    case "ember":
      layers = (
        <>
          <span className={`${fx.layer} ${fx.halo}`} style={{ "--af-halo": "rgba(255, 109, 0, 0.5)" } as Vars} />
          <span className={`${fx.layer} ${fx.spin}`} style={{ "--af-period": "8.5s" } as Vars}>
            <span className={`${fx.layer} ${fx.soft}`}>{ring(fx.emberFill)}</span>
            {ring(fx.emberFill)}
          </span>
        </>
      );
      break;

    case "frost":
      layers = (
        <>
          <span className={`${fx.layer} ${fx.halo}`} style={{ "--af-halo": "rgba(125, 211, 252, 0.45)" } as Vars} />
          {ring(fx.frostFill)}
          <span className={`${fx.layer} ${fx.spin}`} style={{ "--af-period": "11s" } as Vars}>
            {ring(fx.glintFill)}
            <span className={fx.sparkArm}>
              <span className={fx.star} />
            </span>
          </span>
        </>
      );
      break;

    case "gold":
      layers = (
        <>
          <span className={`${fx.layer} ${fx.halo}`} style={{ "--af-halo": "rgba(245, 215, 122, 0.35)" } as Vars} />
          {ring(fx.goldFill)}
          <span className={`${fx.layer} ${fx.sweep}`}>{ring(fx.sheenFill)}</span>
        </>
      );
      break;

    case "neon": {
      const outerW = Math.max(1.5, t * 0.55);
      const innerInset = t * 1.05;
      const innerW = Math.max(1, t * 0.4);
      imageInset = innerInset + innerW + gap;
      layers = (
        <span className={fx.neonWrap}>
          <span className={`${fx.layer} ${fx.solidFill} ${fx.ringMask}`} style={{ "--af-rw": px(outerW) } as Vars} />
          <span
            className={`${fx.layer} ${fx.neonInner} ${fx.ringMask}`}
            style={{ "--af-rw": px(innerW), "--af-inner-inset": px(innerInset) } as Vars}
          />
        </span>
      );
      break;
    }
  }

  return (
    <div className={`${fx.frame} ${className}`} style={vars} data-frame={frame}>
      <span aria-hidden>{layers}</span>
      <div className={fx.clip} style={{ inset: px(imageInset), borderRadius: "9999px" }}>
        {children}
        {overImage}
      </div>
    </div>
  );
}
