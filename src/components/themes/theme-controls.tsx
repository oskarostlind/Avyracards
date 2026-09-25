"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Lock, Crown } from "lucide-react";
import { useT } from "@/i18n/client";
import { normalizeHexColor } from "@/utils/color";

/*
 * Gemensamma kontroller för temaeditorn.
 *
 * Mobil först: alla tryckytor är minst 44×44 px (Apples HIG-minimum) och
 * etiketter är 13 px i meningsversaler i stället för 10 px VERSALER, som
 * var svårläst på telefon.
 */

// --- SEKTIONSRUBRIK ---
export function SectionLabel({ children, htmlFor, aside }: { children: ReactNode; htmlFor?: string; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-slate-300">
        {children}
      </label>
      {aside && <span className="text-xs tabular-nums text-nordic-highlight">{aside}</span>}
    </div>
  );
}

// --- FÄRGVÄLJARE ---
// Färgruta (öppnar systemets färgväljare) + ett hexfält man kan skriva i.
// Systemväljaren på iOS är bra för att hitta en färg men omöjlig för att
// klistra in en exakt varumärkesfärg — därför båda.
export function ColorPicker({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  const t = useT();
  const id = useId();
  const current = normalizeHexColor(value) ?? "#000000";
  const [draft, setDraft] = useState(current.toUpperCase());
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(current.toUpperCase());
    setInvalid(false);
  }, [current]);

  const commit = (raw: string) => {
    const withHash = raw.trim().startsWith("#") ? raw.trim() : `#${raw.trim()}`;
    const hex = normalizeHexColor(withHash);
    if (hex) {
      setInvalid(false);
      onChange(hex);
      setDraft(hex.toUpperCase());
    } else {
      setInvalid(true);
    }
  };

  return (
    <div className="flex min-h-[44px] items-center justify-between gap-3">
      <label htmlFor={id} className="text-[13px] font-semibold text-slate-300">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={7}
          aria-label={`${label} – ${t("themes.controls.hexCode")}`}
          aria-invalid={invalid}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value.toUpperCase());
            // Committa direkt när det är en komplett kod — previewn uppdateras medan man skriver.
            const v = e.target.value.trim();
            if (/^#?[0-9a-fA-F]{6}$/.test(v)) commit(v);
          }}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className={`h-11 w-[92px] rounded-xl border bg-slate-900 px-3 font-mono text-sm uppercase text-nordic-secondary outline-none transition-colors focus:border-purple-500 ${
            invalid ? "border-red-500/70" : "border-white/10"
          }`}
        />
        {/* Den riktiga färg-inputen ligger osynlig ovanpå rutan — hela rutan är tryckyta. */}
        <div
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl shadow-inner ring-1 ring-inset ring-white/20"
          style={{ backgroundColor: current }}
        >
          <input
            type="color"
            aria-label={label}
            value={current}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
      </div>
    </div>
  );
}

// --- SEGMENTED CONTROL ---
export interface SegmentOption {
  value: string;
  label: ReactNode;
  ariaLabel?: string;
  /** Liten prick — t.ex. osparade ändringar i det läget. */
  dot?: boolean;
}

export function SegmentedControl({
  value,
  onChange,
  options,
  ariaLabel,
  size = "md",
  activeClassName = "bg-slate-700/80 text-white shadow-sm",
}: {
  value: string;
  onChange: (v: string) => void;
  options: SegmentOption[];
  ariaLabel?: string;
  size?: "md" | "sm";
  activeClassName?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex rounded-[14px] border border-white/10 bg-slate-900/80 p-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.ariaLabel}
            onClick={() => onChange(opt.value)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97] ${
              size === "sm" ? "min-h-[36px] text-[13px]" : "min-h-[40px] text-sm"
            } ${active ? activeClassName : "text-nordic-highlight hover:text-slate-200"}`}
          >
            {opt.label}
            {opt.dot && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
          </button>
        );
      })}
    </div>
  );
}

// --- SLIDER ---
export function Slider({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit?: string; onChange: (v: number) => void }) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1">
      <SectionLabel htmlFor={id} aside={`${value}${unit ?? ""}`}>
        {label}
      </SectionLabel>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ backgroundImage: `linear-gradient(to right, #a855f7 ${pct}%, #1e293b ${pct}%)` }}
        className="h-11 w-full cursor-pointer appearance-none rounded-full bg-transparent bg-[length:100%_4px] bg-center bg-no-repeat [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
      />
    </div>
  );
}

// --- TOGGLE-RAD ---
// Hela raden är tryckytan (inte bara den lilla switchen). Låsta rader
// öppnar uppgraderingsmodalen i stället för att tyst inte göra något.
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  locked = false,
  onLockedClick,
  badge,
  tone = "purple",
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  locked?: boolean;
  onLockedClick?: () => void;
  badge?: ReactNode;
  tone?: "purple" | "emerald";
}) {
  const on = checked && !locked;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => (locked ? onLockedClick?.() : onChange(!checked))}
      className="flex min-h-[56px] w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-left transition-colors active:bg-slate-800/60"
    >
      <span className="min-w-0 space-y-0.5">
        <span className="flex items-center gap-2 text-sm font-semibold text-nordic-secondary">
          {label}
          {badge}
        </span>
        {description && <span className="block text-xs leading-snug text-nordic-highlight">{description}</span>}
      </span>
      <span
        aria-hidden
        className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ${
          on ? (tone === "emerald" ? "bg-emerald-500" : "bg-purple-500") : "bg-slate-700"
        } ${locked ? "opacity-60" : ""}`}
      >
        <span
          className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-200 ease-out ${
            on ? "translate-x-[20px]" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

// --- VALBAR RUTA (knappform, ram, typsnitt …) ---
export function ChoiceTile({
  selected,
  locked = false,
  onClick,
  children,
  label,
  className = "",
}: {
  selected: boolean;
  locked?: boolean;
  onClick: () => void;
  children: ReactNode;
  label: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border p-2.5 transition-[border-color,background-color,transform] duration-150 active:scale-[0.97] ${
        selected
          ? "border-purple-500 bg-purple-500/10"
          : locked
            ? "border-white/10 bg-slate-900/40"
            : "border-white/10 bg-slate-900/40 hover:border-white/25"
      } ${className}`}
    >
      {children}
      <span className={`text-xs font-semibold ${selected ? "text-purple-300" : locked ? "text-nordic-highlight/60" : "text-slate-300"}`}>
        {label}
      </span>
    </button>
  );
}

// --- PREMIUM BADGE ---
export function PremiumBadge({ isUnlocked, className = "absolute top-2 right-2" }: { isUnlocked: boolean; className?: string }) {
  const t = useT();

  return (
    <div
        className={`${className} p-1 rounded-full shadow-lg flex items-center justify-center z-10 ${
            isUnlocked
            ? "bg-emerald-500 text-white"
            : "bg-amber-500 text-slate-900"
        }`}
        title={isUnlocked ? t("themes.includedInPlan") : t("common.premium")}
    >
        {isUnlocked ? <Crown size={10} fill="currentColor" /> : <Lock size={10} />}
    </div>
  );
}
