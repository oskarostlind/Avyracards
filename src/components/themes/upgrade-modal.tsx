"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, Crown, ImagePlus, X } from "lucide-react";
import { useIsApp } from "@/hooks/useIsApp";
import { useIsAndroidApp } from "@/hooks/useNativePlatform";
import { useT } from "@/i18n/client";
import { defaultSettings, type CustomThemeSettings } from "@/types/theme";
import { AvatarFrame } from "@/components/theme-effects/avatar-frame";
import { DisplayName } from "@/components/theme-effects/display-name";
import { getAnimatedGradientImage, safeAccent, mixHex } from "@/lib/theme-effects";
import { getLinkButtonAppearance } from "@/lib/theme/button-style";
import { FONTS, getFont, getFontStack, getHeadingFontStyle, getBodyFontStyle } from "@/lib/theme/fonts";
import fx from "@/components/theme-effects/theme-effects.module.css";
import type { PremiumTeaser } from "@/components/themes/premium-gate";
import "@/styles/profile-fonts.css";

/*
 * Uppgraderingsrutan ("CTA") i temaeditorn.
 *
 * Säljer med det användaren just tryckte på: den animerade ramen runt deras
 * egen profilbild, knappen i deras egna färger, typsnittet med deras namn …
 * Förhandsvisningen ritas med samma komponenter som profilen (AvatarFrame,
 * DisplayName, button-style), så den visar exakt vad de får.
 *
 * Köpvägen är oförändrad: länken går till /checkout/premium, som själv väljer
 * App Store-köp (IAP) i iOS-appen och Stripe på webben. Rutan startar aldrig
 * något köp själv och visar inget pris (det — med villkoren som 3.1.2(c)
 * kräver — visas i kassan).
 *
 * Rörelse: arket glider upp från nederkanten (mobil) / tonas in och växer lite
 * (desktop) med en kritiskt dämpad kurva och går ut samma väg. CSS-transitions
 * vänder från nuvarande värde om man stänger mitt i. Reducerad rörelse: bara
 * opacitet.
 */

export interface UpgradePreviewData {
  settings?: CustomThemeSettings;
  displayName?: string;
  image?: string | null;
  /** Titlar på användarens länkar — knapp-förhandsvisningen använder dem. */
  linkTitles?: string[];
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Vad som trycktes på. Saknas -> allmän premium-förhandsvisning. */
  teaser?: PremiumTeaser | null;
  preview?: UpgradePreviewData;
}

const EXIT_MS = 300;

export function UpgradeModal({ isOpen, onClose, teaser, preview }: UpgradeModalProps) {
  const t = useT();
  // "30 dagars öppet köp" gäller vår egen webbförsäljning. I appen går köpet via
  // App Store där Apple hanterar återbetalningar — att utlova en egen ångerrätt
  // där är ett vilseledande köpvillkor (3.1.2(c)/2.3.1).
  const isApp = useIsApp();
  // Android-appen säljer inte Premium (Google Plays betalpolicy) — där visas
  // funktionerna men ingen köpknapp och ingen hänvisning till webben.
  const isAndroidApp = useIsAndroidApp();

  // Behåll innehållet monterat under utgångsanimationen.
  const [mounted, setMounted] = useState(isOpen);
  const [shown, setShown] = useState(false);
  const [lastTeaser, setLastTeaser] = useState<PremiumTeaser | null | undefined>(teaser);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLastTeaser(teaser);
      setMounted(true);
      // Två bildrutor: första ritar utgångsläget, andra startar övergången.
      let r2 = 0;
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(r1);
        cancelAnimationFrame(r2);
      };
    }
    setShown(false);
    const timer = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [isOpen, teaser]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus({ preventScroll: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const active: PremiumTeaser = lastTeaser ?? { kind: "generic" };
  const settings: CustomThemeSettings = { ...defaultSettings, ...(preview?.settings ?? {}) };
  const accent = safeAccent(settings.accentColor);
  const name = preview?.displayName || "Avyra";
  const copy = teaserCopy(active, t);
  const premiumFontCount = FONTS.filter((f) => f.isPremium).length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
      data-upgrade-modal=""
    >
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-out [@media(prefers-reduced-transparency:reduce)]:bg-black/90 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative max-h-[calc(100dvh-24px)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[28px] border border-amber-200/15 bg-slate-950 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] transition-[transform,opacity] duration-[380ms] ease-[cubic-bezier(0.2,0.9,0.25,1)] motion-reduce:transform-none sm:rounded-[28px] ${
          shown ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-full sm:translate-y-3 sm:scale-95 sm:opacity-0 motion-reduce:opacity-0"
        }`}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        {/* --- Scen: levande förhandsvisning av det man tryckte på --- */}
        <div className="relative h-[220px] overflow-hidden" style={stageBackground(settings, accent)}>
          <div className="absolute inset-0 flex items-center justify-center px-6 pt-2">
            <Stage teaser={active} settings={settings} name={name} image={preview?.image ?? null} linkTitles={preview?.linkTitles} />
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950 to-transparent" />

          <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-950 shadow-[0_4px_16px_rgba(245,158,11,0.4)]">
            <Crown size={12} strokeWidth={2.5} fill="currentColor" aria-hidden />
            {t("common.premium")}
          </span>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white/85 backdrop-blur-md transition-[transform,background-color] duration-100 active:scale-90 active:bg-black/60 [@media(prefers-reduced-transparency:reduce)]:bg-black/80"
            aria-label={t("themes.upgrade.close")}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pt-1">
          <h2 id="upgrade-title" className="text-[26px] font-bold leading-[1.1] tracking-[-0.02em] text-white">
            {copy.title}
          </h2>
          <p className="mt-2 text-[15px] leading-snug text-slate-300">{copy.body}</p>

          <ul className="mt-5 grid grid-cols-1 gap-2.5">
            {[
              t("themes.upgrade.f1"),
              t("themes.upgrade.f2", { count: premiumFontCount }),
              t("themes.upgrade.f3"),
              t("themes.upgrade.f4"),
            ].map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-200">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${accent}33`, color: mixHex(accent, "#ffffff", 0.45) }}
                >
                  <Check size={12} strokeWidth={3} aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>

          {isAndroidApp ? (
            <p className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center text-sm leading-snug text-amber-100/90">
              {t("premiumCheckout.androidUnavailable")}
            </p>
          ) : (
          <Link
            href="/checkout/premium"
            className="group mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 text-[16px] font-bold text-amber-950 shadow-[0_10px_30px_rgba(245,158,11,0.35)] transition-transform duration-100 active:scale-[0.98]"
          >
            <Crown size={18} strokeWidth={2.5} fill="currentColor" aria-hidden />
            <span>{t("themes.upgrade.cta")}</span>
            <ArrowRight size={18} aria-hidden />
          </Link>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-1 h-11 w-full text-sm font-semibold text-slate-400 transition-opacity duration-100 active:opacity-60"
          >
            {t("themes.upgrade.notNow")}
          </button>

          {!isAndroidApp && (
          <p className="mt-1 text-center text-xs leading-snug text-slate-500">
            {isApp ? t("themes.upgrade.finePrintIos") : t("themes.upgrade.finePrintWeb")}
          </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

type Translate = ReturnType<typeof useT>;

function teaserCopy(teaser: PremiumTeaser, t: Translate): { title: string; body: string } {
  switch (teaser.kind) {
    case "frame":
      return {
        title: t("themes.upgrade.teaser.frameTitle"),
        body: t("themes.upgrade.teaser.frameBody", { name: t(`themes.frames.${teaser.frame}`) }),
      };
    case "nameEffect":
      return {
        title: t("themes.upgrade.teaser.nameEffectTitle"),
        body: t("themes.upgrade.teaser.nameEffectBody", { name: t(`themes.nameEffects.${teaser.effect}`) }),
      };
    case "font":
      return {
        title: t("themes.upgrade.teaser.fontTitle"),
        body: t("themes.upgrade.teaser.fontBody", { name: getFont(teaser.fontId).name }),
      };
    case "buttonVariant":
      return {
        title: t("themes.upgrade.teaser.buttonTitle"),
        body: t("themes.upgrade.teaser.buttonBody", { name: t(`themes.buttonVariants.${teaser.variant}`) }),
      };
    case "animatedBackground":
      return { title: t("themes.upgrade.teaser.animatedBgTitle"), body: t("themes.upgrade.teaser.animatedBgBody") };
    case "backgroundImage":
      return { title: t("themes.upgrade.teaser.bgImageTitle"), body: t("themes.upgrade.teaser.bgImageBody") };
    case "hideBranding":
      return { title: t("themes.upgrade.teaser.brandingTitle"), body: t("themes.upgrade.teaser.brandingBody") };
    case "template":
      return {
        title: t("themes.upgrade.teaser.templateTitle", { name: teaser.template.name }),
        body: t("themes.upgrade.teaser.templateBody"),
      };
    default:
      return { title: t("themes.upgrade.title"), body: t("themes.upgrade.body") };
  }
}

/** Scenens bakgrund: användarens egen bakgrund med en accentglöd — "så här blir det hos dig". */
function stageBackground(settings: CustomThemeSettings, accent: string): CSSProperties {
  const glow = `radial-gradient(55% 65% at 50% 45%, ${accent}40 0%, transparent 70%)`;
  if (settings.backgroundType === "gradient") {
    return {
      backgroundImage: `${glow}, linear-gradient(${settings.gradientDir || "to bottom right"}, ${settings.gradientFrom || "#1e1b4b"}, ${settings.gradientTo || "#020617"})`,
    };
  }
  if (settings.backgroundType === "image" && settings.backgroundImage) {
    return {
      backgroundImage: `linear-gradient(rgba(2,6,23,0.45), rgba(2,6,23,0.45)), url(${JSON.stringify(settings.backgroundImage)})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { backgroundImage: glow, backgroundColor: settings.backgroundColor || "#0f172a" };
}

function Avatar({
  image,
  name,
  size,
  frame,
  accent,
}: {
  image: string | null;
  name: string;
  size: number;
  frame: CustomThemeSettings["frameStyle"];
  accent: string;
}) {
  return (
    <AvatarFrame frame={frame} size={size} accent={accent}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-bold text-white"
          style={{ fontSize: size * 0.38, background: `linear-gradient(135deg, ${mixHex(accent, "#0f172a", 0.35)}, #0f172a)` }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </AvatarFrame>
  );
}

function Stage({
  teaser,
  settings,
  name,
  image,
  linkTitles,
}: {
  teaser: PremiumTeaser;
  settings: CustomThemeSettings;
  name: string;
  image: string | null;
  linkTitles?: string[];
}) {
  const t = useT();
  const accent = safeAccent(settings.accentColor);
  const textColor = settings.textColor || "#ffffff";
  const headingStyle = getHeadingFontStyle(settings.headingFont, settings.font);
  const titles = (linkTitles && linkTitles.length ? linkTitles : ["Instagram", "Portfolio"]).slice(0, 2);

  const identity = (
    frame: CustomThemeSettings["frameStyle"],
    effect: CustomThemeSettings["nameEffect"],
    size = 96,
  ): ReactNode => (
    <div className="flex flex-col items-center gap-3">
      <Avatar image={image} name={name} size={size} frame={frame} accent={accent} />
      <DisplayName
        as="span"
        name={name}
        effect={effect}
        accent={accent}
        textColor={textColor}
        className="max-w-[300px] truncate text-2xl font-bold"
        style={{ ...headingStyle, color: textColor }}
      />
    </div>
  );

  switch (teaser.kind) {
    case "frame":
      return identity(teaser.frame, settings.nameEffect, 112);

    case "nameEffect":
      return (
        <div className="flex flex-col items-center gap-3">
          <Avatar image={image} name={name} size={60} frame={settings.frameStyle} accent={accent} />
          <DisplayName
            as="span"
            name={name}
            effect={teaser.effect}
            accent={accent}
            textColor={textColor}
            className="max-w-[320px] truncate text-[34px] font-bold"
            style={{ ...headingStyle, color: textColor }}
          />
        </div>
      );

    case "font": {
      const font = getFont(teaser.fontId);
      const style = teaser.target === "heading" ? getHeadingFontStyle(font.id, font.id) : getBodyFontStyle(font.id);
      return (
        <div className="flex max-w-full flex-col items-center gap-2 text-center" style={{ color: textColor }}>
          <span className="max-w-[320px] truncate text-[40px] font-bold leading-tight" style={style}>
            {name}
          </span>
          <span className="text-sm opacity-80" style={{ fontFamily: getFontStack(font.id) }}>
            {font.name} · Aa Åå Öö 123
          </span>
        </div>
      );
    }

    case "buttonVariant": {
      const look = getLinkButtonAppearance({ ...settings, buttonVariant: teaser.variant });
      return (
        <div className="flex w-full max-w-[300px] flex-col gap-3" style={getBodyFontStyle(settings.font)}>
          {titles.map((title) => (
            <div
              key={title}
              className={`relative flex h-12 w-full items-center justify-center overflow-hidden px-4 text-sm font-semibold ${look.className}`}
              style={look.style}
            >
              {title}
            </div>
          ))}
        </div>
      );
    }

    case "animatedBackground": {
      const fromGradient = settings.backgroundType === "gradient";
      const image = getAnimatedGradientImage({
        ...settings,
        gradientFrom: fromGradient ? settings.gradientFrom : mixHex(accent, "#1e1b4b", 0.4),
        gradientTo: fromGradient ? settings.gradientTo : "#020617",
      });
      return (
        <div className="absolute inset-0">
          <div aria-hidden className={`absolute inset-0 ${fx.bgDriftViewport}`}>
            <div className={fx.bgDrift} style={{ backgroundImage: image }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pt-2">{identity(settings.frameStyle, settings.nameEffect, 72)}</div>
        </div>
      );
    }

    case "backgroundImage":
      return (
        <div className="flex flex-col items-center gap-3 text-white">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
            <ImagePlus size={28} aria-hidden />
          </span>
          <span className="text-sm font-semibold opacity-90">{t("themes.upgrade.teaser.bgImageStage")}</span>
        </div>
      );

    case "hideBranding":
      return (
        <div className="flex flex-col items-center gap-4">
          {identity(settings.frameStyle, settings.nameEffect, 64)}
          <span className="relative text-[10px] font-bold uppercase tracking-widest text-white/70">
            {t("publicProfile.poweredBy")}
            <span aria-hidden className="absolute inset-x-[-6px] top-1/2 h-[2px] -translate-y-1/2 rounded-full" style={{ backgroundColor: accent }} />
          </span>
        </div>
      );

    case "template": {
      const s: CustomThemeSettings = { ...defaultSettings, ...teaser.template.settings };
      const tplAccent = safeAccent(s.accentColor);
      const look = getLinkButtonAppearance(s, { scale: 0.8 });
      return (
        <div className="absolute inset-0" style={stageBackground(s, tplAccent)}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-10 pt-4" style={{ color: s.textColor || "#fff" }}>
            <Avatar image={image} name={name} size={56} frame={s.frameStyle} accent={tplAccent} />
            <DisplayName
              as="span"
              name={name}
              effect={s.nameEffect}
              accent={s.accentColor}
              textColor={s.textColor}
              className="max-w-[280px] truncate text-xl font-bold"
              style={getHeadingFontStyle(s.headingFont, s.font)}
            />
            {titles.map((title) => (
              <div
                key={title}
                className={`flex h-9 w-full max-w-[240px] items-center justify-center text-xs font-semibold ${look.className}`}
                style={{ ...look.style, ...getBodyFontStyle(s.font) }}
              >
                {title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    default:
      return identity("aurora", "shimmer", 100);
  }
}
