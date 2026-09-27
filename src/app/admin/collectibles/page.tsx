import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gem } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/feature-access";
import { formatSerial } from "@/lib/collectibles-shared";
import { getT } from "@/i18n/server";

export const metadata = { title: "Admin | Samlarobjekt" };
export const dynamic = "force-dynamic";

/*
 * Samlarobjekt (limited edition): drops, utdelat/kvar och ägare med löpnummer.
 * Bara läsning — drops skapas via migration tills det finns ett behov av UI.
 * Upplagorna är små (Founders = 100), så alla ägare hämtas i en fråga.
 */
export default async function AdminCollectiblesPage() {
  const t = getT();
  const session = await auth();
  if (!canAccess("admin_panel", { isAdmin: session?.user?.role === "ADMIN" })) redirect("/dashboard");

  const drops = await prisma.drop.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      collectibles: {
        orderBy: { serial: "asc" },
        take: 1000,
        select: {
          serial: true,
          source: true,
          grantedAt: true,
          user: { select: { id: true, username: true, email: true } },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-nordic-primary p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-nordic-highlight transition-colors hover:text-nordic-secondary"
          >
            <ArrowLeft size={16} /> {t("common.back")}
          </Link>
          <h1 className="mt-4 flex items-center gap-3 text-2xl font-bold text-slate-100">
            <Gem size={22} className="text-amber-300" />
            {t("collectibles.admin.title")}
          </h1>
          <p className="mt-1 text-sm text-nordic-highlight">{t("collectibles.admin.intro")}</p>
        </div>

        {drops.length === 0 && (
          <div className="rounded-2xl border border-nordic-highlight/30 bg-slate-900/50 p-10 text-center text-sm text-nordic-highlight">
            {t("collectibles.admin.empty")}
          </div>
        )}

        {drops.map((drop) => {
          const issued = Math.min(drop.issuedCount, drop.maxSupply);
          const remaining = Math.max(0, drop.maxSupply - issued);
          const soldOut = remaining === 0;
          const pct = drop.maxSupply > 0 ? Math.round((issued / drop.maxSupply) * 100) : 0;
          const state = soldOut
            ? t("collectibles.admin.soldOut")
            : drop.active && (!drop.endsAt || drop.endsAt > new Date())
              ? t("collectibles.admin.open")
              : t("collectibles.admin.closed");

          return (
            <section key={drop.id} className="overflow-hidden rounded-2xl border border-nordic-highlight/40 bg-slate-900/50">
              <div className="space-y-4 border-b border-nordic-highlight/30 bg-slate-900/80 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">{drop.name}</h2>
                    <p className="font-mono text-xs text-nordic-highlight">
                      {drop.id} · {drop.autoGrantOnSignup ? t("collectibles.admin.autoGrant") : t("collectibles.admin.manual")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      soldOut ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {state}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    [t("collectibles.admin.issued"), issued],
                    [t("collectibles.admin.remaining"), remaining],
                    [t("collectibles.admin.supply"), drop.maxSupply],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl bg-slate-950/50 p-3">
                      <div className="text-xs text-nordic-highlight">{label}</div>
                      <div className="mt-1 text-2xl font-bold tabular-nums text-slate-100">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800" aria-hidden>
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="px-5 py-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-300">
                  {t("collectibles.admin.owners")} ({drop.collectibles.length})
                </h3>
                {drop.collectibles.length === 0 ? (
                  <p className="text-sm text-nordic-highlight">{t("collectibles.admin.noOwners")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs text-nordic-highlight">
                        <tr>
                          <th className="py-2 pr-3 font-medium">{t("collectibles.admin.serial")}</th>
                          <th className="py-2 pr-3 font-medium">{t("collectibles.admin.user")}</th>
                          <th className="py-2 pr-3 font-medium">{t("collectibles.admin.source")}</th>
                          <th className="py-2 font-medium">{t("collectibles.admin.granted")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {drop.collectibles.map((c) => (
                          <tr key={c.serial}>
                            <td className="py-2 pr-3 font-mono font-semibold tabular-nums text-amber-200">
                              #{formatSerial(c.serial, drop.maxSupply)}
                            </td>
                            <td className="py-2 pr-3">
                              {c.user ? (
                                <Link href={`/admin/users/${c.user.id}`} className="text-slate-100 hover:underline">
                                  @{c.user.username}
                                  <span className="block text-xs text-nordic-highlight">{c.user.email}</span>
                                </Link>
                              ) : (
                                <span className="italic text-nordic-highlight">{t("collectibles.admin.deleted")}</span>
                              )}
                            </td>
                            <td className="py-2 pr-3 text-xs text-slate-300">
                              {t(`collectibles.admin.sources.${c.source}`)}
                            </td>
                            <td className="py-2 text-xs tabular-nums text-nordic-highlight">
                              {c.grantedAt.toLocaleDateString("sv-SE")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
