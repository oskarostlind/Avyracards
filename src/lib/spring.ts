/**
 * Minimal fjäderanimation för gest-drivna ytor (bottom sheet i temaeditorn).
 *
 * Varför inte CSS-transitions: en transition går inte att gripa mitt i och
 * vända utan ett synligt hack. En fjäder startar alltid från nuvarande värde
 * och nuvarande hastighet, så användaren kan ta tag i arket mitt i rörelsen.
 *
 * Parametrarna följer Apples modell (dampingRatio + response) i stället för
 * massa/styvhet/dämpning:
 *   - dampingRatio 1.0 = kritiskt dämpad, ingen översväng (standard för UI)
 *   - dampingRatio ~0.8 = lite studs — bara när gesten själv hade fart
 *   - response = ungefär hur snabbt målet nås, i sekunder (inte en duration)
 *
 * Ingen extern dependency: Appflow-bygget är minnessnålt (se CLAUDE.md).
 */

export interface SpringOptions {
  /** 1.0 = ingen studs. Lägre = mer studs. */
  dampingRatio?: number;
  /** Sekunder. Lägre = snabbare. */
  response?: number;
  /** Starthastighet i enheter/sekund (t.ex. fingrets hastighet vid släpp). */
  velocity?: number;
}

export interface SpringHandle {
  cancel: () => void;
  /** Aktuellt värde och hastighet — används när en ny gest avbryter animationen. */
  current: () => { value: number; velocity: number };
}

export function animateSpring(
  from: number,
  to: number,
  onUpdate: (value: number) => void,
  { dampingRatio = 1, response = 0.35, velocity = 0 }: SpringOptions = {},
  onComplete?: () => void,
): SpringHandle {
  const stiffness = Math.pow((2 * Math.PI) / response, 2);
  const damping = (4 * Math.PI * dampingRatio) / response;

  // Dold flik/app i bakgrunden: requestAnimationFrame körs inte alls, och en
  // animation som väntar på att bli klar (t.ex. stängning av ett ark) skulle
  // hänga. Hoppa direkt till målet.
  if (typeof document !== "undefined" && document.hidden) {
    onUpdate(to);
    onComplete?.();
    return { cancel: () => {}, current: () => ({ value: to, velocity: 0 }) };
  }

  let x = from;
  let v = velocity;
  let frame = 0;
  let last = 0;
  let done = false;

  const step = (now: number) => {
    if (done) return;
    // Första bildrutan: ingen tid har gått än.
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;

    // Semi-implicit Euler i små delsteg — stabilt även för styva fjädrar.
    const substeps = 4;
    const h = dt / substeps;
    for (let i = 0; i < substeps; i++) {
      const force = -stiffness * (x - to) - damping * v;
      v += force * h;
      x += v * h;
    }

    if (Math.abs(x - to) < 0.5 && Math.abs(v) < 8) {
      done = true;
      onUpdate(to);
      onComplete?.();
      return;
    }

    onUpdate(x);
    frame = requestAnimationFrame(step);
  };

  frame = requestAnimationFrame(step);

  return {
    cancel: () => {
      done = true;
      cancelAnimationFrame(frame);
    },
    current: () => ({ value: x, velocity: v }),
  };
}

/**
 * Var en kastad yta skulle stanna av sig själv (samma avtagande som iOS-scroll).
 * Används för att välja snappunkt utifrån vart gesten är på väg, inte var
 * fingret råkade släppa.
 */
export function projectMomentum(velocityPxPerSec: number, decelerationRate = 0.998): number {
  return ((velocityPxPerSec / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Mjukt motstånd förbi en gräns i stället för ett hårt stopp. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
