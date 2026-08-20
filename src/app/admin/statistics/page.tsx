import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { sv, enGB } from "date-fns/locale";
import {
  ArrowLeft,
  BarChart3,
  Eye,
  MousePointerClick,
  Users,
  Fingerprint,
  Globe,
  Smartphone,
  Share2,
  CreditCard,
  Package,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getReadableSource } from "@/lib/analytics/events";
import { AdminStatsChart, type AdminStatsChartPoint } from "@/components/admin/admin-stats-chart";
import { getI18n, getT } from "@/i18n/server";

export async function generateMetadata() {
  return { title: getT()("admin.stats.metaTitle") };
}

const PERIODS = [7, 30, 90] as const;

export default async function AdminStatisticsPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const { locale, t } = getI18n();
  const dateLocale = locale === "en" ? enGB : sv;

  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const daysParam = parseInt(searchParams.days ?? "30", 10);
  const selectedDays = (PERIODS as readonly number[]).includes(daysParam) ? daysParam : 30;

  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, selectedDays - 1));

  // Aggregeringen sker i databasen (inte findMany + JS) — tabellen är
  // plattformsövergripande och växer obegränsat.
  const [
    daily,
    totals,
    firstHashRow,
    sourceRows,
    deviceRows,
    countryRows,
    profileRows,
    totalUsers,
    newUsers,
    premiumUsers,
    cardTotals,
    cardsClaimed,
    ordersInPeriod,
    revenueAgg,
  ] = await Promise.all([
    prisma.$queryRaw<
      Array<{ day: Date; views: bigint; clicks: bigint; unique_visitors: bigint; hashed: bigint }>
    >`
      SELECT date_trunc('day', "createdAt") AS day,
             COUNT(*) FILTER (WHERE "type" = 'VIEW')  AS views,
             COUNT(*) FILTER (WHERE "type" = 'CLICK') AS clicks,
             COUNT(DISTINCT "visitorHash")            AS unique_visitors,
             COUNT("visitorHash")                     AS hashed
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<
      Array<{ views: bigint; clicks: bigint; unique_visitors: bigint; active_profiles: bigint }>
    >`
      SELECT COUNT(*) FILTER (WHERE "type" = 'VIEW')  AS views,
             COUNT(*) FILTER (WHERE "type" = 'CLICK') AS clicks,
             COUNT(DISTINCT "visitorHash")            AS unique_visitors,
             COUNT(DISTINCT "profileOwnerId") FILTER (WHERE "type" = 'VIEW') AS active_profiles
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
    `,
    prisma.analyticsEvent.findFirst({
      where: { visitorHash: { not: null } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["source", "referrer"],
      where: { type: "VIEW", createdAt: { gte: startDate, lte: endDate } },
      _count: { _all: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["device"],
      where: { type: "VIEW", createdAt: { gte: startDate, lte: endDate } },
      _count: { _all: true },
      orderBy: { _count: { device: "desc" } },
      take: 6,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["country"],
      where: { type: "VIEW", createdAt: { gte: startDate, lte: endDate } },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 10,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["profileOwnerId"],
      where: { type: "VIEW", createdAt: { gte: startDate, lte: endDate } },
      _count: { _all: true },
      orderBy: { _count: { profileOwnerId: "desc" } },
      take: 10,
    }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startDate } } }),
    prisma.user.count({ where: { isPremium: true } }),
    prisma.card.count(),
    prisma.card.count({ where: { status: "CLAIMED" } }),
    prisma.order.count({
      where: { createdAt: { gte: startDate }, status: { in: ["PAID", "SHIPPED"] } },
    }),
    prisma.order.aggregate({
      _sum: { amountTotal: true },
      where: { createdAt: { gte: startDate }, status: { in: ["PAID", "SHIPPED"] } },
    }),
  ]);

  const firstHashDate = firstHashRow?.createdAt ?? null;
  const firstHashDay = firstHashDate ? startOfDay(firstHashDate) : null;

  // Fyll ut dagar utan events med nollor (samma mönster som dashboard-statistiken).
  const byDay = new Map(daily.map((row) => [startOfDay(new Date(row.day)).toISOString(), row]));
  const chartData: AdminStatsChartPoint[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const key = startOfDay(cursor).toISOString();
    const row = byDay.get(key);
    const dayHasHashes = row ? Number(row.hashed) > 0 : false;
    const dayIsMeasurable = firstHashDay !== null && startOfDay(cursor) >= firstHashDay;

    chartData.push({
      date: format(cursor, "d MMM", { locale: dateLocale }),
      views: row ? Number(row.views) : 0,
      clicks: row ? Number(row.clicks) : 0,
      // Null (= lucka i grafen) för dagar före migrationen — 0 vore en lögn.
      unique: dayIsMeasurable ? (dayHasHashes ? Number(row!.unique_visitors) : 0) : null,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const totalViews = Number(totals[0]?.views ?? 0);
  const totalClicks = Number(totals[0]?.clicks ?? 0);
  const totalUnique = Number(totals[0]?.unique_visitors ?? 0);
  const activeProfiles = Number(totals[0]?.active_profiles ?? 0);

  // Källor grupperas på läsbart namn (nfc/qr/Instagram/...), inte råvärde,
  // så att t.ex. apple_wallet och google_wallet rullas ihop som i dashboarden.
  const sourceCounts = new Map<string, number>();
  for (const row of sourceRows) {
    const name = getReadableSource(row.source, row.referrer, t);
    sourceCounts.set(name, (sourceCounts.get(name) ?? 0) + row._count._all);
  }
  const topSources = [...sourceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const profileOwners =
    profileRows.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: profileRows.map((r) => r.profileOwnerId) } },
          select: { id: true, username: true, name: true },
        })
      : [];
  const ownerById = new Map(profileOwners.map((u) => [u.id, u]));

  const formatRevenue = new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  });

  const maxSource = topSources[0]?.[1] ?? 0;
  const maxCountry = Number(countryRows[0]?._count._all ?? 0);
  const totalDeviceViews = deviceRows.reduce((sum, r) => sum + r._count._all, 0);

  return (
    <div className="min-h-screen bg-nordic-primary p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm text-nordic-highlight hover:text-nordic-secondary transition-colors"
          >
            <ArrowLeft size={16} /> {t("admin.stats.back")}
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-100">
                <BarChart3 size={22} className="text-purple-400" />
                {t("admin.stats.title")}
              </h1>
              <p className="mt-1 text-sm text-nordic-highlight">{t("admin.stats.subtitle")}</p>
            </div>
            <div className="flex gap-2">
              {PERIODS.map((days) => (
                <Link
                  key={days}
                  href={`/admin/statistics?days=${days}`}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    selectedDays === days
                      ? "bg-slate-100 text-slate-900"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {t("admin.stats.days", { count: days })}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* KPI-kort */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={<Eye size={18} className="text-purple-400" />}
            label={t("admin.stats.views")}
            value={totalViews.toLocaleString("sv-SE")}
          />
          <KpiCard
            icon={<MousePointerClick size={18} className="text-sky-400" />}
            label={t("admin.stats.clicks")}
            value={totalClicks.toLocaleString("sv-SE")}
          />
          <KpiCard
            icon={<Fingerprint size={18} className="text-emerald-400" />}
            label={t("admin.stats.uniqueVisitors")}
            value={firstHashDate ? totalUnique.toLocaleString("sv-SE") : "–"}
            hint={
              firstHashDate
                ? t("admin.stats.uniqueSince", {
                    date: format(firstHashDate, "d MMM yyyy", { locale: dateLocale }),
                  })
                : t("admin.stats.uniqueNotYet")
            }
          />
          <KpiCard
            icon={<Users size={18} className="text-amber-400" />}
            label={t("admin.stats.activeProfiles")}
            value={activeProfiles.toLocaleString("sv-SE")}
            hint={t("admin.stats.activeProfilesHint")}
          />
        </div>

        {/* Trend */}
        <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-6">
          <h2 className="mb-4 font-semibold text-slate-200">{t("admin.stats.trendTitle")}</h2>
          {totalViews + totalClicks === 0 ? (
            <p className="py-12 text-center text-sm text-nordic-highlight">
              {t("admin.stats.noData")}
            </p>
          ) : (
            <AdminStatsChart
              data={chartData}
              labels={{
                views: t("admin.stats.views"),
                clicks: t("admin.stats.clicks"),
                unique: t("admin.stats.uniqueVisitors"),
              }}
            />
          )}
        </div>

        {/* Källor / Enheter / Länder */}
        <div className="grid gap-6 lg:grid-cols-3">
          <ListCard icon={<Share2 size={16} className="text-purple-400" />} title={t("admin.stats.topSources")}>
            {topSources.length === 0 ? (
              <EmptyRow text={t("admin.stats.noData")} />
            ) : (
              topSources.map(([name, count]) => (
                <BarRow key={name} label={name} count={count} max={maxSource} color="bg-purple-500/60" />
              ))
            )}
          </ListCard>

          <ListCard icon={<Smartphone size={16} className="text-sky-400" />} title={t("admin.stats.devices")}>
            {deviceRows.length === 0 ? (
              <EmptyRow text={t("admin.stats.noData")} />
            ) : (
              deviceRows.map((row) => (
                <BarRow
                  key={row.device ?? "unknown"}
                  label={row.device ?? t("admin.stats.unknown")}
                  count={row._count._all}
                  max={totalDeviceViews}
                  color="bg-sky-500/60"
                  suffix={
                    totalDeviceViews > 0
                      ? `${Math.round((row._count._all / totalDeviceViews) * 100)}%`
                      : undefined
                  }
                />
              ))
            )}
          </ListCard>

          <ListCard icon={<Globe size={16} className="text-emerald-400" />} title={t("admin.stats.countries")}>
            {countryRows.length === 0 ? (
              <EmptyRow text={t("admin.stats.noData")} />
            ) : (
              countryRows.map((row) => (
                <BarRow
                  key={row.country ?? "unknown"}
                  label={row.country ?? t("admin.stats.unknown")}
                  count={row._count._all}
                  max={maxCountry}
                  color="bg-emerald-500/60"
                />
              ))
            )}
          </ListCard>
        </div>

        {/* Toppprofiler + Plattforms-KPI:er */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 overflow-hidden">
            <div className="border-b border-nordic-highlight/40 px-6 py-4">
              <h2 className="font-semibold text-slate-200">{t("admin.stats.topProfiles")}</h2>
            </div>
            {profileRows.length === 0 ? (
              <p className="p-6 text-sm text-nordic-highlight">{t("admin.stats.noData")}</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/50 text-nordic-highlight">
                  <tr>
                    <th className="px-6 py-3 font-medium">{t("admin.stats.profile")}</th>
                    <th className="px-6 py-3 font-medium text-right">{t("admin.stats.views")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {profileRows.map((row) => {
                    const owner = ownerById.get(row.profileOwnerId);
                    return (
                      <tr key={row.profileOwnerId} className="hover:bg-slate-800/30">
                        <td className="px-6 py-3">
                          {owner?.username ? (
                            <Link
                              href={`/admin/users/${owner.id}`}
                              className="text-slate-200 hover:text-purple-400 hover:underline"
                            >
                              @{owner.username}
                            </Link>
                          ) : (
                            <span className="text-nordic-highlight">{t("admin.stats.unknown")}</span>
                          )}
                          {owner?.name && (
                            <span className="ml-2 text-xs text-nordic-highlight">{owner.name}</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-300">
                          {row._count._all.toLocaleString("sv-SE")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-6">
            <h2 className="mb-4 font-semibold text-slate-200">{t("admin.stats.platformTitle")}</h2>
            <dl className="space-y-4 text-sm">
              <PlatformRow
                icon={<Users size={14} />}
                label={t("admin.stats.totalUsers")}
                value={totalUsers.toLocaleString("sv-SE")}
              />
              <PlatformRow
                icon={<Users size={14} />}
                label={t("admin.stats.newUsers")}
                value={`+${newUsers.toLocaleString("sv-SE")}`}
              />
              <PlatformRow
                icon={<Users size={14} />}
                label={t("admin.stats.premiumUsers")}
                value={premiumUsers.toLocaleString("sv-SE")}
              />
              <PlatformRow
                icon={<CreditCard size={14} />}
                label={t("admin.stats.claimedCards")}
                value={`${cardsClaimed.toLocaleString("sv-SE")} / ${cardTotals.toLocaleString("sv-SE")}`}
              />
              <PlatformRow
                icon={<Package size={14} />}
                label={t("admin.stats.ordersInPeriod")}
                value={ordersInPeriod.toLocaleString("sv-SE")}
              />
              <PlatformRow
                icon={<Package size={14} />}
                label={t("admin.stats.revenue")}
                value={formatRevenue.format((revenueAgg._sum.amountTotal ?? 0) / 100)}
              />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-nordic-highlight">
        {icon} {label}
      </div>
      <div className="mt-2 text-3xl font-bold text-slate-100">{value}</div>
      {hint && <div className="mt-1 text-xs text-nordic-highlight">{hint}</div>}
    </div>
  );
}

function ListCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-6">
      <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-200">
        {icon} {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function BarRow({
  label,
  count,
  max,
  color,
  suffix,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
  suffix?: string;
}) {
  const width = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-nordic-highlight">
          {count.toLocaleString("sv-SE")}
          {suffix ? ` · ${suffix}` : ""}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-xs text-nordic-highlight">{text}</p>;
}

function PlatformRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-nordic-highlight">
        {icon} {label}
      </dt>
      <dd className="font-semibold text-slate-200">{value}</dd>
    </div>
  );
}
