import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReportStatus } from "@prisma/client";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { getModerationQueue } from "@/actions/moderation";
import { reportReasonKey, type ReportReasonKey } from "@/lib/moderation-shared";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { getT } from "@/i18n/server";

export const metadata = { title: "Admin | Moderation" };

const TABS: { key: ReportStatus | "ALL"; labelKey: string }[] = [
  { key: "PENDING", labelKey: "admin.reports.filterPending" },
  { key: "REVIEWING", labelKey: "admin.reports.filterReviewing" },
  { key: "ACTIONED", labelKey: "admin.reports.filterActioned" },
  { key: "DISMISSED", labelKey: "admin.reports.filterDismissed" },
  { key: "ALL", labelKey: "admin.reports.filterAll" },
];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const t = getT();
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const status = (searchParams.status as ReportStatus | "ALL") || "PENDING";
  const { reports, pendingCount } = await getModerationQueue(status);

  return (
    <div className="min-h-screen bg-nordic-primary p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-nordic-highlight hover:text-nordic-secondary transition-colors"
          >
            <ArrowLeft size={16} /> Tillbaka
          </Link>
          <h1 className="mt-4 flex items-center gap-3 text-2xl font-bold text-slate-100">
            <ShieldAlert size={22} className="text-red-400" />
            Moderation
            {pendingCount > 0 && (
              <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-400">
                {pendingCount} nya
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-nordic-highlight">
            {t("admin.reports.intro")}
            inom 24 timmar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/reports?status=${tab.key}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                status === tab.key
                  ? "bg-slate-100 text-slate-900"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {t(tab.labelKey)}
            </Link>
          ))}
        </div>

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-nordic-highlight/30 bg-slate-900/50 p-10 text-center text-sm text-nordic-highlight">
            {t("admin.reports.empty")}
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-nordic-highlight/30 bg-slate-900/50 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/u/${report.reportedUser.username}`}
                        target="_blank"
                        className="font-semibold text-slate-100 hover:underline"
                      >
                        @{report.reportedUser.username}
                      </Link>
                      {report.reportedUser.isSuspended && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">
                          {t("admin.reports.suspended")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-nordic-highlight">
                      {report.reportedUser.email}
                    </p>
                  </div>
                  <div className="text-right text-xs text-nordic-highlight">
                    <div className="font-medium text-amber-400">
                      {t(reportReasonKey(report.reason as ReportReasonKey))}
                    </div>
                    <div>{report.createdAt.toLocaleString("sv-SE")}</div>
                  </div>
                </div>

                {report.details && (
                  <p className="rounded-xl bg-slate-950/60 p-3 text-sm text-slate-300 whitespace-pre-wrap">
                    {report.details}
                  </p>
                )}

                <p className="text-xs text-nordic-highlight">
                  {t("admin.reports.reporter", { email: report.reporterEmail ?? t("admin.reports.anonymous"), status: report.status })}
                </p>

                <ModerationActions
                  reportId={report.id}
                  userId={report.reportedUser.id}
                  isSuspended={report.reportedUser.isSuspended}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
