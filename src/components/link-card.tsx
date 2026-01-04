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
      className="flex items-center justify-between rounded-xl border border-nordic-support bg-nordic-primary p-4 shadow-sm"
      {...dragProps}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-nordic-secondary/10 text-nordic-accent border border-nordic-support">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-nordic-secondary">{label}</p>
          <p className="text-sm text-nordic-highlight">{url}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleVisibility?.(id, !isVisible)}
          className="rounded-full border border-nordic-support px-3 py-1 text-xs font-medium text-nordic-highlight hover:bg-nordic-primary/60"
        >
          {isVisible ? "Dölj" : "Visa"}
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(id)}
          className="rounded-full border border-rose-300 px-3 py-1 text-xs font-medium text-rose-400 hover:bg-rose-300/10"
        >
          Ta bort
        </button>
      </div>
    </div>
  );
}
