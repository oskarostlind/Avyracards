import type { CSSProperties } from "react";
import type { CustomThemeSettings } from "@/types/theme";

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

export function ProfileBackgroundLayer({
  settings,
}: {
  settings: Pick<CustomThemeSettings, "backgroundType" | "backgroundImage" | "gradientDir" | "gradientFrom" | "gradientTo">;
}) {
  const backgroundImage = getProfileBackgroundImage(settings);
  if (!backgroundImage) return null;

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

  return <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={style} data-profile-bg="" />;
}
