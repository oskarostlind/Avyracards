"use client";

import { useState, type ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-3xl border border-nordic-highlight/40 bg-nordic-primary/80 shadow-xl shadow-black/30">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-nordic-secondary">{title}</h2>
          {description && (
            <p className="text-xs text-nordic-highlight">{description}</p>
          )}
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-nordic-highlight/40 bg-slate-900 text-xs text-slate-300">
          {open ? "−" : "+"}
        </div>
      </button>

      {open && (
        <div className="border-t border-nordic-highlight/40 px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </section>
  );
}
