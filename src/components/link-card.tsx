import { HTMLAttributes } from "react";

import { getPlatformIcon } from "@/utils/platform";

interface LinkCardProps {
  id: string;
  label: string;
  url: string;
  isVisible: boolean;
  onToggleVisibility?: (id: string, next: boolean) => void;
  onDelete?: (id: string) => void;
  dragProps?: HTMLAttributes<HTMLDivElement>;
}

export function LinkCard({ id, label, url, isVisible, onToggleVisibility, onDelete, dragProps }: LinkCardProps) {
  const Icon = getPlatformIcon(url);

  return (
    <div
      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      {...dragProps}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-slate-900">{label}</p>
          <p className="text-sm text-slate-500">{url}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleVisibility?.(id, !isVisible)}
          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          {isVisible ? "Dölj" : "Visa"}
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(id)}
          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50"
        >
          Ta bort
        </button>
      </div>
    </div>
  );
}
