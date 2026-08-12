import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle, AlertTriangle, XCircle, MinusCircle } from "lucide-react";
import { buildConfigReport, type CheckStatus } from "@/lib/config/health";

export const metadata = {
  title: "Systemstatus | AvyraCards",
};

// Läser process.env vid varje anrop — får aldrig cachas.
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<CheckStatus, { color: string; label: string }> = {
  ok: { color: "text-emerald-400", label: "OK" },
  warn: { color: "text-amber-400", label: "Varning" },
  error: { color: "text-red-400", label: "Fel" },
  off: { color: "text-nordic-highlight", label: "Av" },
};

function StatusIcon({ status }: { status: CheckStatus }) {
  const cls = STATUS_STYLES[status].color;
  if (status === "ok") return <CheckCircle size={16} className={cls} />;
  if (status === "warn") return <AlertTriangle size={16} className={cls} />;
  if (status === "error") return <XCircle size={16} className={cls} />;
  return <MinusCircle size={16} className={cls} />;
}

export default async function AdminSystemPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const report = buildConfigReport();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1 text-sm text-nordic-highlight hover:text-white"
      >
        <ChevronLeft size={16} /> Till admin
      </Link>

      <h1 className="text-2xl font-semibold text-white">Systemstatus</h1>
      <p className="mt-2 text-sm text-nordic-highlight">
        Kontroll av miljövariabler och konfiguration. Sidan visar bara om något är satt och
        rimligt — aldrig själva värdet.
      </p>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-nordic-highlight">
            Miljö: <span className="font-medium text-white">{report.environment}</span>
          </span>
          <span className="text-nordic-highlight">
            Fel: <span className="font-medium text-red-400">{report.errorCount}</span>
          </span>
          <span className="text-nordic-highlight">
            Varningar: <span className="font-medium text-amber-400">{report.warnCount}</span>
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {report.groups.map((group) => (
          <section key={group.id}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-nordic-highlight">
              {group.title}
            </h2>
            <ul className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/5">
              {group.checks.map((check) => (
                <li key={check.id} className="flex gap-3 p-4">
                  <span className="mt-0.5 shrink-0">
                    <StatusIcon status={check.status} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{check.label}</p>
                    <p className="mt-0.5 text-sm text-nordic-highlight">{check.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
