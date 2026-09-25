"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

/**
 * En fällbar sektion — används på EN nivå (tidigare låg sektioner i
 * sektioner, vilket gav kort-i-kort-i-kort och smala fält på mobil).
 * Innehållet hålls monterat när det är stängt så att inmatning inte tappas.
 */
export function CollapsibleSection({ title, description, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/40">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-nordic-secondary">{title}</span>
          {description && <span className="text-[13px] text-nordic-highlight">{description}</span>}
        </span>
        <ChevronDown size={20} className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <div id={contentId} hidden={!open} className="space-y-4 border-t border-white/10 px-4 pb-4 pt-4 sm:px-5">
        {children}
      </div>
    </section>
  );
}
