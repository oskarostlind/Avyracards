import type { CSSProperties } from "react";
import type { CustomThemeSettings } from "@/types/theme";
import { getAnimatedGradientImage, getPatternBackground } from "@/lib/theme-effects";
import fx from "@/components/theme-effects/theme-effects.module.css";

/**
 * Bakgrundslager för publika profiler (bild eller gradient).
 *
 * Varför ett eget position:fixed-lager i stället för
 * `background-attachment: fixed` på <main>: iOS Safari/WKWebView (dvs. både
 * Safari och vår Capacitor-app) ignorerar `fixed` och behandlar det som
 * `scroll`. Då räknas `background-size: cover` mot HELA sidans höjd, inte
 * skärmen — bilden skalas upp flera gånger och beskärs, och blir suddig ju
 * fler länkar profilen har. Ett fast lager i skärmstorlek ger samma "bilden
 * står still när man scrollar"-effekt på alla plattformar, i rätt skala.
 */
export function getProfileBackgroundImage(
  settings: Pick<CustomThemeSettings, "backgroundType" | "backgroundImage" | "gradientDir" | "gradientFrom" | "gradientTo">,
): string | undefined {
  if (settings.backgroundType === "image" && settings.backgroundImage) {
    return `url(${JSON.stringify(settings.backgroundImage)})`;
  }
  if (settings.backgroundType === "gradient") {
    return `linear-gradient(${settings.gradientDir || "to bottom right"}, ${settings.gradientFrom || "#000"}, ${settings.gradientTo || "#000"})`;
  }
  return undefined;
}

type LayerSettings = Pick<
  CustomThemeSettings,
  | "backgroundType"
  | "backgroundImage"
  | "gradientDir"
  | "gradientFrom"
  | "gradientTo"
  | "accentColor"
  | "textColor"
  | "backgroundAnimated"
  | "backgroundPattern"
  | "backgroundPatternOpacity"
>;

// Samma skäl som ovan: fast lager i skärmstorlek (100lvh), inte
// background-attachment. Gäller även det drivande lagret och mönstret.
const FIXED_LAYER: CSSProperties = { height: "100lvh" };

export function ProfileBackgroundLayer({
  settings,
  animate = true,
}: {
  settings: LayerSettings;
  /** false = rita den animerade gradienten som vanlig gradient (t.ex. premium som gått ut). */
  animate?: boolean;
}) {
  // Mönster (gratis) ligger över bakgrunden och bildens overlay (z-[1]),
  // men under innehållet (z-10). Det är statiskt — ingen animation.
  const pattern = getPatternBackground(settings.backgroundPattern, settings.textColor, settings.backgroundPatternOpacity);
  const patternLayer = pattern ? (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ ...FIXED_LAYER, backgroundImage: pattern.backgroundImage, backgroundSize: pattern.backgroundSize, backgroundRepeat: "repeat" }}
      data-profile-pattern=""
    />
  ) : null;

  // Animerad gradient (premium): ett överdimensionerat lager som glider med
  // transform i stället för att animera background-position — det kan
  // compositorn köra utan omritning. Sanitering nollar flaggan för gratis.
  if (animate && settings.backgroundType === "gradient" && settings.backgroundAnimated) {
    return (
      <>
        <div aria-hidden className={`pointer-events-none fixed inset-0 z-0 ${fx.bgDriftViewport}`} style={FIXED_LAYER} data-profile-bg="">
          <div className={fx.bgDrift} style={{ backgroundImage: getAnimatedGradientImage(settings) }} />
        </div>
        {patternLayer}
      </>
    );
  }

  const backgroundImage = getProfileBackgroundImage(settings);
  if (!backgroundImage) return patternLayer;

  const style: CSSProperties = {
    backgroundImage,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    // 100lvh = största viewporten (adressfältet infällt), så lagret inte
    // ändrar storlek — och bilden inte "hoppar" — när Safaris verktygsfält
    // döljs vid scroll. Äldre webbläsare ignorerar värdet och använder inset-0.
    height: "100lvh",
  };

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={style} data-profile-bg="" />
      {patternLayer}
    </>
  );
}
