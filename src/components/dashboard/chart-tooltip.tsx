"use client";

/**
 * Gemensam tooltip för alla Recharts-grafer på statistiksidan.
 *
 * Recharts default-tooltip visar råa dataKeys ("value : 7"), vilket varken är
 * översatt eller begripligt. Den här komponenten tar i stället en `format`-
 * funktion som gör om varje serie till färdig text ("7 visningar"), och ritar
 * den i samma mörka kortstil som resten av sidan.
 */

type TooltipEntry = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

export type ChartTooltipProps = {
  /** Recharts injicerar dessa när komponenten skickas till <Tooltip content={...} />. */
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  /** Text per serie, t.ex. entry => `${entry.value} visningar`. */
  format: (entry: TooltipEntry) => string;
  /** Dölj rubrikraden när kategorin redan framgår av serietexten. */
  hideLabel?: boolean;
};

export function ChartTooltip({
  active,
  payload,
  label,
  format,
  hideLabel = false,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const rows = payload.filter((entry) => entry?.value !== undefined && entry?.value !== null);
  if (!rows.length) return null;

  return (
    <div
      // max-w i vw: på en smal telefon får tooltipen aldrig bli bredare än
      // skärmen, och Recharts håller den innanför grafens viewBox.
      className="pointer-events-none max-w-[70vw] rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2.5 shadow-2xl shadow-black/50 backdrop-blur-md"
    >
      {!hideLabel && label !== undefined && label !== "" && (
        <p className="mb-1.5 text-[13px] font-semibold text-slate-100">{String(label)}</p>
      )}

      <ul className="space-y-1">
        {rows.map((entry, index) => (
          <li
            key={`${String(entry.dataKey ?? index)}-${index}`}
            className="flex items-center gap-2 text-[13px] leading-snug text-slate-300"
          >
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color || "#94a3b8" }}
            />
            <span>{format(entry)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
