"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setReportStatus, setUserSuspension } from "@/actions/moderation";
import { useT } from "@/i18n/client";

interface Props {
  reportId: string;
  userId: string;
  isSuspended: boolean;
}

export function ModerationActions({ reportId, userId, isSuspended }: Props) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Loader2 size={14} className="animate-spin text-slate-400" />}

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await setUserSuspension(userId, !isSuspended);
            if (!isSuspended) await setReportStatus(reportId, "ACTIONED");
          })
        }
        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
          isSuspended
            ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
            : "bg-red-600 text-white hover:bg-red-500"
        }`}
      >
        {isSuspended ? t("admin.reports.unsuspend") : t("admin.reports.suspend")}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => setReportStatus(reportId, "REVIEWING"))}
        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
      >
        {t("admin.reports.markReviewing")}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => setReportStatus(reportId, "DISMISSED"))}
        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
      >
        {t("admin.reports.dismiss")}
      </button>
    </div>
  );
}
