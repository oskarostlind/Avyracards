import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { format, subDays, formatDistanceToNow, startOfDay, endOfDay } from "date-fns";
import { sv, enGB } from "date-fns/locale";

import { prisma } from "@/lib/prisma";
import { AnalyticsView } from "@/components/dashboard/analytics-view";
import { getReadableSource } from "@/lib/analytics/events";
import { getI18n } from "@/i18n/server";
import { getT } from "@/i18n/server";

export async function generateMetadata() {
  return { title: `${getT()("analytics.title")} | AvyraCards` };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { locale, t } = getI18n();
  const dateLocale = locale === "en" ? enGB : sv;

  const session = await auth();
  if (!session?.user) return redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, username: true },
  });

  if (!user) return redirect("/login");

  const daysParam = typeof searchParams.days === "string" ? parseInt(searchParams.days, 10) : 30;
  const selectedDaysRaw = isNaN(daysParam) ? 30 : daysParam;
  const selectedDays = Math.max(1, Math.min(selectedDaysRaw, 90));

  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, selectedDays));

  const events = await prisma.analyticsEvent.findMany({
    where: {
      profileOwnerId: session.user.id,
      createdAt: { 
          gte: startDate,
          lte: endDate 
      },
    },
    include: { link: true },
    orderBy: { createdAt: "desc" },
  });

  const eventsByDay = new Map<string, { views: number; clicks: number }>();

  for (const event of events) {
    const day = startOfDay(new Date(event.createdAt));
    const key = day.toISOString();
    const bucket = eventsByDay.get(key) ?? { views: 0, clicks: 0 };

    if (event.type === "VIEW") {
      bucket.views += 1;
    } else if (event.type === "CLICK") {
      bucket.clicks += 1;
    }

    eventsByDay.set(key, bucket);
  }

  const chartData: { date: string; views: number; clicks: number }[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const key = startOfDay(currentDate).toISOString();
    const bucket = eventsByDay.get(key);

    chartData.push({
      date: format(currentDate, "d MMM", { locale: dateLocale }),
      views: bucket?.views ?? 0,
      clicks: bucket?.clicks ?? 0,
    });

    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
  }

  const totalViews = events.filter((e) => e.type === "VIEW").length;
  // Klick = alla click som har ett riktigt linkId
  const totalClicks = events.filter((e) => e.type === "CLICK" && e.linkId).length;
  // vCard = klick som kom från vcard källan
  const totalVcardDownloads = events.filter((e) => e.type === "CLICK" && e.source === "vcard").length;
  
  const ctr = totalViews > 0 ? (((totalClicks + totalVcardDownloads) / totalViews) * 100).toFixed(1) : "0.0";

  const linkClicks: Record<string, { title: string; url: string; clicks: number }> = {}; 
  events
    .filter((e) => e.type === "CLICK" && e.link)
    .forEach((e) => {
      const linkId = e.linkId!;
      if (!linkClicks[linkId]) {
        linkClicks[linkId] = {
          title: e.link?.title || "Okänd länk",
          url: e.link?.url || "#",
          clicks: 0, 
        };
      }
      linkClicks[linkId].clicks++; 
    });

  const topLinks = Object.values(linkClicks).sort((a, b) => b.clicks - a.clicks).slice(0, 5);

  const sourcesMap: Record<string, number> = {};
  
  events.filter(e => e.type === "VIEW").forEach(e => {
    const readableName = getReadableSource(e.source, e.referrer);
    sourcesMap[readableName] = (sourcesMap[readableName] || 0) + 1;
  });
  
  const trafficSources = Object.entries(sourcesMap)
    .sort((a, b) => b[1] - a[1]) 
    .map(([name, value]) => ({ name, value }));

  const countryMap: Record<string, number> = {};
  events.filter(e => e.type === "VIEW" && e.country).forEach(e => {
    const c = e.country!;
    countryMap[c] = (countryMap[c] || 0) + 1;
  });
  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }));

  // Tio i stället för fem: en push-notis kan tryckas en stund efter att den kom,
  // och då ska händelsen fortfarande finnas kvar i listan att highlighta.
  const RECENT_ACTIVITY_LIMIT = 10;

  // Källor som inte säger något om VARIFRÅN besökaren kom och därför inte ska
  // vävas in i radtexten ("Någon öppnade din profil via Direkt" vore nonsens).
  const genericSourceLabels = new Set([
    t("analytics.sources.direct"),
    t("analytics.sources.internal"),
  ]);

  const recentActivity = events.slice(0, RECENT_ACTIVITY_LIMIT).map((e) => {
    const isVcard = e.source?.trim().toLowerCase() === "vcard";
    const readableSource = getReadableSource(e.source, e.referrer, t);

    return {
      id: e.id,
      type: e.type as "VIEW" | "CLICK",
      country: e.country,
      city: e.city,
      device: e.device,
      // ISO-sträng: klienten formaterar i användarens tidszon och språk.
      createdAt: new Date(e.createdAt).toISOString(),
      timeAgo: formatDistanceToNow(new Date(e.createdAt), { addSuffix: true, locale: dateLocale }),
      source: readableSource,
      // vCard-källan beskriver handlingen, inte varifrån besökaren kom.
      hasSource: !isVcard && !genericSourceLabels.has(readableSource),
      linkTitle: e.link?.title ?? null,
      linkUrl: e.link?.url ?? null,
      // Nyckel i stället för färdig sträng: vyn översätter den, och lägger på
      // suffixet "Via" när källan är känd. `visitorHash` skickas ALDRIG ut.
      messageKey:
        e.type === "VIEW"
          ? "analytics.activity.view"
          : isVcard
            ? "analytics.activity.contactSaved"
            : "analytics.activity.click",
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        
        <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-5xl p-4 sm:p-6 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                <h1 className="text-2xl font-bold text-slate-100">{t("analytics.title")}</h1>
                <p className="text-nordic-highlight">{t("analytics.subtitle", { username: user.username ?? "" })}</p>
                </div>
                {!user.isPremium && (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-nordic-highlight border border-nordic-highlight/40">
                    {t("analytics.freePlan")}
                </span>
                )}
            </div>

            <AnalyticsView
                isPremium={user.isPremium}
                stats={{ totalViews, totalClicks, ctr, totalVcardDownloads }}
                chartData={chartData}
                topLinks={topLinks}
                trafficSources={trafficSources}
                topCountries={topCountries}
                recentActivity={recentActivity}
                currentDays={selectedDays}
            />
        </div>
    </div>
  );
}