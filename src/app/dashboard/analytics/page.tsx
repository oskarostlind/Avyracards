import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { format, subDays, isSameDay, formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

import { prisma } from "@/lib/prisma";
import { AnalyticsView } from "@/components/dashboard/analytics-view";

export const metadata = {
  title: "Statistik | AvyraCards",
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) return redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, username: true },
  });

  if (!user) return redirect("/login");

  // VIKTIGT: Vi blockerar inte sidan för gratisanvändare längre.
  // Vi hämtar datan ändå, men 'AnalyticsView' kommer dölja detaljerna.

  const endDate = new Date();
  const startDate = subDays(endDate, 30);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      profileOwnerId: session.user.id,
      createdAt: { gte: startDate },
    },
    include: { link: true },
    orderBy: { createdAt: "desc" }, // Senaste först för feeden
  });

  // --- 1. GRAF & TOTALER (För alla) ---
  const chartData = [];
  let currentDate = startDate;

  // Skapa datum-buckets
  while (currentDate <= endDate) {
    const dayEvents = events.filter((e) =>
      isSameDay(new Date(e.createdAt), currentDate)
    );
    chartData.push({
      date: format(currentDate, "d MMM", { locale: sv }), 
      views: dayEvents.filter((e) => e.type === "VIEW").length,
      clicks: dayEvents.filter((e) => e.type === "CLICK").length,
    });
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
  }

  const totalViews = events.filter((e) => e.type === "VIEW").length;
  const totalClicks = events.filter((e) => e.type === "CLICK").length;
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

  // --- 2. TOPPLISTA LÄNKAR (För alla) ---
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

  // --- 3. TRAFIKKÄLLOR (Premium Data) ---
  // Vi räknar ut det även för gratis, men visar det suddigt i frontend
  const sourcesMap: Record<string, number> = {};
  events.filter(e => e.type === "VIEW").forEach(e => {
    const s = e.source || "direct";
    sourcesMap[s] = (sourcesMap[s] || 0) + 1;
  });
  const trafficSources = Object.entries(sourcesMap).map(([name, value]) => ({ name, value }));

  // --- 4. GEOGRAFI (Premium Data) ---
  const countryMap: Record<string, number> = {};
  events.filter(e => e.type === "VIEW" && e.country).forEach(e => {
    const c = e.country!;
    countryMap[c] = (countryMap[c] || 0) + 1;
  });
  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }));

  // --- 5. SENASTE AKTIVITET (Premium Data) ---
  // Vi tar de 5 senaste händelserna
  const recentActivity = events.slice(0, 5).map(e => ({
    id: e.id,
    type: e.type,
    country: e.country,
    city: e.city,
    device: e.device,
    timeAgo: formatDistanceToNow(new Date(e.createdAt), { addSuffix: true, locale: sv }),
    source: e.source,
  }));

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Statistik</h1>
          <p className="text-slate-400">Insikter för @{user.username}</p>
        </div>
        {!user.isPremium && (
           <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400 border border-slate-700">
             Gratisplan
           </span>
        )}
      </div>

      <AnalyticsView
        isPremium={user.isPremium}
        stats={{ totalViews, totalClicks, ctr }}
        chartData={chartData}
        topLinks={topLinks}
        trafficSources={trafficSources}
        topCountries={topCountries}
        recentActivity={recentActivity}
      />
    </div>
  );
}