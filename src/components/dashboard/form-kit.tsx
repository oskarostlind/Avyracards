"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Loader2, RotateCcw } from "lucide-react";

/*
 * Gemensamma formulärdelar för dashboarden.
 * - 16 px i fälten: under 16 px zoomar iOS Safari in när man trycker i ett fält.
 * - Etiketter kopplade till fälten (htmlFor/id) — saknades tidigare.
 */

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-3 text-base text-nordic-secondary placeholder:text-slate-500 outline-none transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30";

export function TextField({
  label,
  hint,
  className = "",
  ...props
}: { label: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-[13px] font-semibold text-slate-300">
        {label}
      </label>
      <input id={id} className={fieldClass} {...props} />
      {hint && <p className="text-[13px] leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  className = "",
  ...props
}: { label: string; hint?: ReactNode } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-[13px] font-semibold text-slate-300">
        {label}
      </label>
      <textarea id={id} className={`${fieldClass} min-h-[96px] resize-y`} {...props} />
      {hint && <p className="text-[13px] leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}

/** En sektion (ett kort, en nivå). */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
      <div>
        <h3 className="text-[15px] font-semibold text-nordic-secondary">{title}</h3>
        {description && <p className="mt-0.5 text-[13px] text-nordic-highlight">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Spara-rad. Mobil: fast längst ner när det finns osparade ändringar (samma
 * mönster som temaeditorn). Desktop: klistrad i nederkant av formuläret.
 */
export function SaveBar({
  dirty,
  saving,
  onDiscard,
  saveLabel,
  savingLabel,
  discardLabel,
  hint,
}: {
  dirty: boolean;
  saving: boolean;
  onDiscard: () => void;
  saveLabel: string;
  savingLabel: string;
  discardLabel: string;
  hint: string;
}) {
  const visible = dirty || saving;
  return (
    <>
      {/* Plats så att sista fältet inte hamnar under den fasta raden på mobil. */}
      {visible && <div className="h-24 sm:hidden" aria-hidden />}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 px-4 pt-3 backdrop-blur-xl transition-[transform,opacity,visibility] duration-300 ease-out motion-reduce:transition-none sm:sticky sm:bottom-4 sm:mt-2 sm:rounded-2xl sm:border sm:px-4 sm:pb-3 ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none invisible translate-y-full opacity-0 sm:hidden"
        }`}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <p className="hidden min-w-0 flex-1 truncate text-sm text-nordic-highlight sm:block">{hint}</p>
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-white/[0.07] px-4 text-sm font-semibold text-slate-300 active:scale-[0.97] disabled:opacity-50"
          >
            <RotateCcw size={16} /> {discardLabel}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-600 text-[15px] font-semibold text-white shadow-lg shadow-purple-500/25 active:scale-[0.98] disabled:opacity-70 sm:flex-none sm:px-8"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" /> {savingLabel}
              </>
            ) : (
              <>
                <span aria-hidden className="h-2 w-2 rounded-full bg-amber-300" />
                {saveLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/** "foretag.se" -> "https://foretag.se". Servern kräver en fullständig URL i dessa fält. */
export function withHttps(value: string): string {
  const v = value.trim();
  if (!v) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return v;
  if (/\s/.test(v) || !v.includes(".")) return v;
  return `https://${v.replace(/^\/+/, "")}`;
}
